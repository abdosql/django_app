import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

interface Incident {
  id: number;
  device: {
    device_id: string;
    name: string;
    location: string;
  };
  alert: {
    id: number;
    alert_type: string;
    severity: string;
    message: string;
  };
  status: 'open' | 'in_progress' | 'resolved';
  description: string;
  start_time: string;
  resolution_time?: string;
  assigned_to?: {
    id: number;
    name: string;
  };
  resolved_by?: {
    id: number;
    name: string;
  };
  current_escalation_level: number;
  comments: Array<{
    id: number;
    operator: {
      id: number;
      name: string;
    };
    comment: string;
    action_taken: boolean;
    timestamp: string;
  }>;
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = async (status?: string) => {
    try {
      setLoading(true);
      const response = await apiService.getIncidents(status);
      if (response.error) throw new Error(response.error);
      setIncidents(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIncidentDetails = async (id: number) => {
    try {
      const response = await apiService.getIncidentDetails(id);
      if (response.error) throw new Error(response.error);
      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const addComment = async (id: number, comment: string, actionTaken: boolean) => {
    try {
      const response = await apiService.addIncidentComment(id, comment, actionTaken);
      if (response.error) throw new Error(response.error);
      await fetchIncidents(); // Refresh incidents list
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const generateReport = async (id: number, format: 'json' | 'pdf' | 'csv' = 'json') => {
    try {
      const response = await apiService.generateIncidentReport(id, format);
      if (response.error) throw new Error(response.error);
      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  return {
    incidents,
    loading,
    error,
    fetchIncidents,
    getIncidentDetails,
    addComment,
    generateReport,
  };
}
