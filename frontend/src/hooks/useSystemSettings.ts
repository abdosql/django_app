import { useState, useEffect } from 'react';

interface SystemSettings {
  normal_temp_min: number;
  normal_temp_max: number;
  critical_temp_min: number;
  critical_temp_max: number;
  reading_interval: number;
  alert_reset_time: number;
  require_2fa: boolean;
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    normal_temp_min: 2.0,
    normal_temp_max: 8.0,
    critical_temp_min: 0.0,
    critical_temp_max: 10.0,
    reading_interval: 20,
    alert_reset_time: 30,
    require_2fa: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const response = await fetch('/api/settings/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, isLoading, error };
} 