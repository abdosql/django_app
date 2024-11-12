import { useState, useEffect, useCallback } from 'react';

interface TemperatureReading {
  temperature: number;
  humidity: number;
  power_status: boolean;
  battery_level: number;
  timestamp: string;
}

interface WebSocketMessage {
  type: 'reading_update';
  data: TemperatureReading;
}

export function useTemperatureReadings() {
  const [currentReading, setCurrentReading] = useState<TemperatureReading | null>(null);
  const [maxTemp, setMaxTemp] = useState<number>(0);
  const [minTemp, setMinTemp] = useState<number>(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Function to fetch initial readings
  const fetchReadings = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/api/readings/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch readings');
      }

      const data = await response.json();
      
      if (data.length > 0) {
        const latestReading = data[0];
        const previousReading = data[1];
        
        setCurrentReading(latestReading);
        
        // Calculate max and min temperatures from last 24 hours
        const last24Hours = data.filter((reading: TemperatureReading) => {
          const readingTime = new Date(reading.timestamp);
          const dayAgo = new Date();
          dayAgo.setHours(dayAgo.getHours() - 24);
          return readingTime >= dayAgo;
        });
        
        const temperatures = last24Hours.map((r: TemperatureReading) => r.temperature);
        setMaxTemp(Math.max(...temperatures));
        setMinTemp(Math.min(...temperatures));
        
        // Determine trend
        if (previousReading) {
          if (latestReading.temperature > previousReading.temperature) {
            setTrend('up');
          } else if (latestReading.temperature < previousReading.temperature) {
            setTrend('down');
          } else {
            setTrend('stable');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching readings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch readings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket connection setup
  useEffect(() => {
    const token = sessionStorage.getItem('access_token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/readings/`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      // Authenticate WebSocket connection
      ws.send(JSON.stringify({ token }));
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'reading_update') {
          const newReading = message.data;
          
          setCurrentReading(prevReading => {
            if (!prevReading) return newReading;
            
            // Update trend based on new reading
            if (newReading.temperature > prevReading.temperature) {
              setTrend('up');
            } else if (newReading.temperature < prevReading.temperature) {
              setTrend('down');
            } else {
              setTrend('stable');
            }
            
            return newReading;
          });

          // Update max/min if necessary
          setMaxTemp(prev => Math.max(prev, newReading.temperature));
          setMinTemp(prev => Math.min(prev, newReading.temperature));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after a delay
      setTimeout(() => {
        setSocket(null);  // This will trigger a reconnection
      }, 5000);
    };

    setSocket(ws);

    // Initial fetch
    fetchReadings();

    // Cleanup
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [fetchReadings]);

  // Fallback polling mechanism
  useEffect(() => {
    // Only use polling if WebSocket is not connected
    if (socket?.readyState !== WebSocket.OPEN) {
      const interval = setInterval(fetchReadings, 20000);
      return () => clearInterval(interval);
    }
  }, [socket, fetchReadings]);

  return {
    currentTemperature: currentReading?.temperature ?? 0,
    maxTemperature: maxTemp,
    minTemperature: minTemp,
    trend,
    isLoading,
    error,
    humidity: currentReading?.humidity ?? 0,
    powerStatus: currentReading?.power_status ?? false,
    batteryLevel: currentReading?.battery_level ?? 0
  };
} 