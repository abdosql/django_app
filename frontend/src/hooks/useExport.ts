import { useState } from 'react';
import { apiService } from '../services/api.service';

interface ExportOptions {
  startDate?: string;
  endDate?: string;
  deviceId?: string;
  format?: 'csv' | 'json' | 'pdf';
}

export function useExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReadings = async (options: ExportOptions) => {
    try {
      setLoading(true);
      setError(null);

      if (!options.startDate || !options.endDate) {
        throw new Error('Start date and end date are required');
      }

      const response = await apiService.exportReadings(
        options.format || 'csv',
        {
          start: options.startDate,
          end: options.endDate
        }
      );
      
      if (response.error) throw new Error(response.error);
      
      // The response.data is already a blob from the API service
      const blob = response.data;
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `temperature_readings_${new Date().toISOString().split('T')[0]}.${options.format || 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to export readings';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    exportReadings,
    loading,
    error,
  };
}
