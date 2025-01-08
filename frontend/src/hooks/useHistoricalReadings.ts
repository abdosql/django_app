import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';

interface Reading {
  temperature: number;
  humidity: number;
  timestamp: string;
}

interface TemperatureStats {
  readings: Reading[];
  average_temperature: number;
  max_temperature: number;
  min_temperature: number;
}

export function useHistoricalReadings(
  timeRange: '24h' | '7d' | '30d' | 'custom',
  customStartDate?: string,
  customEndDate?: string,
  deviceId?: string
) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let response;
      if (timeRange === 'custom' && customStartDate && customEndDate) {
        response = await apiService.getCustomTemperatureStats(
          customStartDate,
          customEndDate,
          deviceId
        );
      } else {
        response = await apiService.getTemperatureStats(timeRange, deviceId);
      }

      if (response.error) {
        throw new Error(response.error);
      }
      
      const stats = response.data;
      if (!stats || !stats.readings) {
        throw new Error('Invalid response format');
      }

      // Sort readings by timestamp in ascending order
      const sortedReadings = [...stats.readings].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      setReadings(sortedReadings);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
      setReadings([]);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, customStartDate, customEndDate, deviceId]);

  useEffect(() => {
    fetchHistoricalData();
  }, [fetchHistoricalData]);

  return { readings, isLoading, error, refetch: fetchHistoricalData };
}