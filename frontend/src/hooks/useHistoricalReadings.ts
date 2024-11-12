import { useState, useEffect } from 'react';

interface Reading {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export function useHistoricalReadings(timeRange: '24h' | '7d' | '30d') {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setIsLoading(true);
        const token = sessionStorage.getItem('access_token');
        
        // Calculate the start date based on the time range
        const now = new Date();
        const startDate = new Date(now);
        switch (timeRange) {
          case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        }

        const response = await fetch(
          `/api/readings/?start_date=${startDate.toISOString()}&end_date=${now.toISOString()}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }

        const data = await response.json();
        setReadings(data);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [timeRange]);

  return { readings, isLoading, error };
} 