import { authService } from './auth.service';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface AlertsResponse {
  alerts: Array<{
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
  }>;
  total: number;
}

interface SystemSettings {
  normal_temp_min: number;
  normal_temp_max: number;
  critical_temp_min: number;
  critical_temp_max: number;
  reading_interval: number;
  alert_reset_time: number;
  require_2fa: boolean;
  updated_at?: string;
}

class ApiService {
  private baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = sessionStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          await authService.refreshToken();
          return this.request(endpoint, options);
        }
        throw new Error(`API Error: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { data };
      }

      return { data: await response.blob() as any };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: 'An unknown error occurred' };
    }
  }

  // Temperature Readings
  async getLatestReadings() {
    return this.request<any[]>('/monitoring/readings/');
  }

  async getTemperatureStats(period: '24h' | '7d' | '30d' | 'custom') {
    return this.request<any>(`/monitoring/temperature/stats/?period=${period}`);
  }

  async getCustomTemperatureStats(startDate: string, endDate: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    return this.request<any>(`/monitoring/temperature/stats/?${params.toString()}`);
  }

  public async exportReadings(format: 'csv', dateRange?: { start: string; end: string }) {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('start_date', dateRange.start);
        params.append('end_date', dateRange.end);
      }
      
      const response = await fetch(`${this.baseUrl}/monitoring/readings/export/?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
          'Accept': 'text/csv'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to export data';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) {
          // If error text is not JSON, use it directly
          errorMessage = errorText || errorMessage;
        }
        console.error('Export error:', errorText);
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'temperature_readings.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Export failed:', error);
      return { error: error instanceof Error ? error.message : 'Failed to export data' };
    }
  }

  // Alerts
  async getActiveAlerts(page: number = 1, limit: number = 10) {
    return this.request<AlertsResponse>(`/monitoring/alerts/active/?page=${page}&limit=${limit}`);
  }

  async acknowledgeAlert(alertId: number) {
    return this.request(`/monitoring/alerts/${alertId}/resolve/`, {
      method: 'POST'
    });
  }

  // Incidents
  async getIncidents() {
    return this.request<any[]>('/monitoring/incidents/');
  }

  async getIncidentDetails(id: number) {
    return this.request<any>(`/monitoring/incidents/${id}/`);
  }

  async acknowledgeIncident(id: number, data: { acknowledgment_note: string }) {
    return this.request<any>(`/monitoring/incidents/${id}/acknowledge/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createIncident(data: {
    alert_id: number;
    description: string;
    device_id: string;
  }) {
    return this.request<any>('/monitoring/incidents/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addIncidentComment(incidentId: number, data: { 
    comment: string; 
    action_taken?: boolean;
    is_read?: boolean;
  }) {
    return this.request<any>(`/monitoring/incidents/${incidentId}/add_comment/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getIncidentComments(incidentId: number) {
    return this.request<any[]>(`/monitoring/incidents/${incidentId}/comments/`);
  }

  async getIncidentTimeline(incidentId: number) {
    return this.request<any[]>(`/monitoring/incidents/${incidentId}/timeline/`);
  }

  async generateIncidentReport(incidentId: number) {
    return this.request<any>(`/monitoring/incidents/${incidentId}/report/`);
  }

  // Devices
  async getDevices() {
    return this.request<any[]>('/monitoring/devices/');
  }

  async registerDevice(data: {
    device_id: string;
    name: string;
    location: string;
    reading_interval: number;
  }) {
    return this.request<any>('/monitoring/devices/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateDeviceStatus(deviceId: string, status: 'online' | 'offline' | 'warning' | 'error') {
    return this.request<any>(`/monitoring/devices/${deviceId}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<any[]>('/notifications/');
  }

  async markNotificationAsRead(notificationId: number) {
    return this.request<any>(`/notifications/${notificationId}/read/`, {
      method: 'POST'
    });
  }

  // Operators
  async getOperators() {
    return this.request<any[]>('/operators/');
  }

  async updateOperator(operatorId: number, data: any) {
    return this.request<any>(`/operators/${operatorId}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Settings
  async getSettings() {
    return this.request<SystemSettings>('/settings/');
  }

  async updateSettings(data: Partial<SystemSettings>) {
    return this.request<SystemSettings>('/settings/', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
}

export const apiService = new ApiService();
