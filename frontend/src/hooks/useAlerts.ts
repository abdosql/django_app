import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';

interface Alert {
  id: number;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  consecutiveCount: number;
  is_resolved: boolean;
  temperature: number;
  device: {
    id: number;
    name: string;
    location: string;
  };
}

interface AlertsResponse {
  alerts: Alert[];
  total: number;
}

export function useAlerts(limit: number = 10, deviceId?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAlerts = useCallback(async (pageNum: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getActiveAlerts(pageNum, limit, deviceId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data as AlertsResponse;
      
      if (pageNum === 1) {
        setAlerts(data.alerts);
      } else {
        setAlerts(prev => [...prev, ...data.alerts]);
      }
      
      setTotalCount(data.total);
      setHasMore(data.alerts.length === limit);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, [limit, deviceId]);

  useEffect(() => {
    fetchAlerts(1);
  }, [fetchAlerts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAlerts(nextPage);
    }
  }, [isLoading, hasMore, page, fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    hasMore,
    loadMore,
    totalCount,
    refetch: () => fetchAlerts(1)
  };
}