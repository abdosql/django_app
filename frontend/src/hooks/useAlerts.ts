import { useState, useEffect } from 'react';

export interface Alert {
  id: number;
  type: 'severe' | 'critical' | 'normal';
  message: string;
  timestamp: string;
  consecutiveCount: number;
  is_resolved: boolean;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const response = await fetch('/api/alerts/active/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch alerts');
        }

        const data = await response.json();
        setAlerts(data);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  return { alerts, isLoading, error };
} 