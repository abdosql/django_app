import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';

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

export function useTemperatureReadings(deviceId?: string) {
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
      console.log('useTemperatureReadings: Fetching readings for device:', deviceId);
      setIsLoading(true);
      setError(null);
      const response = await apiService.getLatestReadings(deviceId);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const readings = response.data as TemperatureReading[];
      console.log('useTemperatureReadings: Received readings:', readings);
      
      if (readings && readings.length > 0) {
        const latestReading = readings[0];
        const previousReading = readings[1];
        
        setCurrentReading(latestReading);
        
        // Calculate max and min temperatures from last 24 hours
        const last24Hours = readings.filter((reading: TemperatureReading) => {
          const readingTime = new Date(reading.timestamp);
          const dayAgo = new Date();
          dayAgo.setHours(dayAgo.getHours() - 24);
          return readingTime >= dayAgo;
        });

        const temperatures = last24Hours.map((r: TemperatureReading) => r.temperature);
        if (temperatures.length > 0) {
          setMaxTemp(Math.max(...temperatures));
          setMinTemp(Math.min(...temperatures));
        }
        
        // Calculate trend
        if (previousReading) {
          const diff = latestReading.temperature - previousReading.temperature;
          if (Math.abs(diff) < 0.5) {
            setTrend('stable');
          } else {
            setTrend(diff > 0 ? 'up' : 'down');
          }
        }
      } else {
        // Reset state when no readings are available
        setCurrentReading(null);
        setMaxTemp(0);
        setMinTemp(0);
        setTrend('stable');
      }
    } catch (err) {
      console.error('Error fetching readings:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching readings');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Reset state when device changes
  useEffect(() => {
    console.log('useTemperatureReadings: Device changed to:', deviceId);
    setCurrentReading(null);
    setMaxTemp(0);
    setMinTemp(0);
    setTrend('stable');
    fetchReadings();
  }, [deviceId, fetchReadings]);

  // WebSocket connection setup
  useEffect(() => {
    if (!deviceId) {
      console.log('useTemperatureReadings: No device selected, skipping WebSocket connection');
      return;
    }

    const token = sessionStorage.getItem('access_token');
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/readings/${deviceId}`;
    
    console.log('useTemperatureReadings: Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      // Authenticate WebSocket connection
      ws.send(JSON.stringify({ token }));
      console.log('WebSocket connected for device:', deviceId);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'reading_update') {
          const newReading = message.data;
          console.log('useTemperatureReadings: Received new reading:', newReading);
          
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
      console.error('WebSocket error for device:', deviceId, error);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected for device:', deviceId);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        setSocket(null);  // This will trigger a reconnection
      }, 5000);
    };

    setSocket(ws);

    // Cleanup
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('useTemperatureReadings: Closing WebSocket for device:', deviceId);
        ws.close();
      }
    };
  }, [deviceId]);

  // Fallback polling mechanism
  useEffect(() => {
    // Only use polling if WebSocket is not connected
    if (socket?.readyState !== WebSocket.OPEN) {
      console.log('useTemperatureReadings: Starting polling for device:', deviceId);
      const interval = setInterval(fetchReadings, 20000);
      return () => clearInterval(interval);
    }
  }, [socket, fetchReadings, deviceId]);

  return {
    currentTemperature: currentReading?.temperature ?? 0,
    maxTemperature: maxTemp,
    minTemperature: minTemp,
    trend,
    isLoading,
    error,
    humidity: currentReading?.humidity ?? 0,
    powerStatus: currentReading?.power_status ?? false,
    batteryLevel: currentReading?.battery_level ?? 0,
    refetch: fetchReadings
  };
}