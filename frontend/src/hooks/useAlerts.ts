import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';

export interface Alert {
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

export function useAlerts(limit: number = 10) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAlerts = useCallback(async (pageNumber: number = 1) => {
    try {
      setIsLoading(true);
      const response = await apiService.getActiveAlerts(pageNumber, limit);
      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data as AlertsResponse;
      if (pageNumber === 1) {
        setAlerts(data.alerts || []);
      } else {
        setAlerts(prev => [...prev, ...(data.alerts || [])]);
      }

      setTotalCount(data.total || 0);
      setHasMore((data.alerts || []).length === limit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch alerts';
      console.error('Error fetching alerts:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore]);

  useEffect(() => {
    fetchAlerts(page);
  }, [page, fetchAlerts]);

  useEffect(() => {
    // Poll for new alerts every 30 seconds, but only for the first page
    const interval = setInterval(() => {
      if (page === 1) {
        fetchAlerts(1);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [page, fetchAlerts]);

  return { alerts, isLoading, error, hasMore, loadMore, totalCount };
}