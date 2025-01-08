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

interface CreateIncidentData {
  device_id: string;
  alert: number;
  description: string;
  status: string;
  alert_count: number;
  current_escalation_level: number;
  start_time: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'http://localhost:8000/api';
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const token = authService.getAccessToken();
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      };

      console.log('Making request to:', `${this.baseUrl}${endpoint}`);
      console.log('Request options:', {
        ...options,
        headers,
        body: options.body ? JSON.parse(options.body as string) : undefined
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(JSON.stringify(errorData));
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return { data };
      }

      throw new Error('Invalid response format: expected JSON');
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred while making the request'
      };
    }
  }

  // Temperature Readings
  async getLatestReadings(deviceId?: string) {
    const params = new URLSearchParams();
    if (deviceId) {
      params.append('device_id', deviceId);
    }
    console.log('Fetching latest readings for device:', deviceId);
    return this.request<any[]>(`/monitoring/readings/?${params.toString()}`);
  }

  async getTemperatureStats(period: '24h' | '7d' | '30d' | 'custom', deviceId?: string) {
    const params = new URLSearchParams({ period });
    if (deviceId) {
      params.append('device_id', deviceId);
    }
    console.log('Fetching temperature stats for device:', deviceId, 'period:', period);
    return this.request<any>(`/monitoring/temperature/stats/?${params.toString()}`);
  }

  async getCustomTemperatureStats(startDate: string, endDate: string, deviceId?: string) {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate
    });
    if (deviceId) {
      params.append('device_id', deviceId);
    }
    console.log('Fetching custom temperature stats for device:', deviceId, 'period:', startDate, 'to', endDate);
    return this.request<any>(`/monitoring/temperature/stats/?${params.toString()}`);
  }

  // Alerts
  async getActiveAlerts(page: number = 1, limit: number = 10, deviceId?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    if (deviceId) {
      params.append('device_id', deviceId);
    }
    console.log('Fetching active alerts for device:', deviceId, 'page:', page);
    return this.request<AlertsResponse>(`/monitoring/alerts/active/?${params.toString()}`);
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

  async acknowledgeIncident(id: number, data: { acknowledgment_note: string }) {
    return this.request<any>(`/monitoring/incidents/${id}/acknowledge/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async createIncident(data: CreateIncidentData) {
    console.log('Creating incident with data:', data);
    return this.request<any>('/monitoring/incidents/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getIncidentComments(id: number) {
    return this.request<any[]>(`/monitoring/incidents/${id}/comments/`);
  }

  async getIncidentTimeline(id: number) {
    return this.request<any[]>(`/monitoring/incidents/${id}/timeline/`);
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

  async getUnreadCount() {
    return this.request<{ count: number }>('/notifications/unread_count/');
  }

  async getNotificationsByStatus(status: 'PENDING' | 'SENT' | 'FAILED' | 'READ') {
    return this.request<any[]>(`/notifications/by_status/?status=${status}`);
  }

  // System Settings
  async getSettings(): Promise<ApiResponse<SystemSettings>> {
    return this.request<SystemSettings>('/settings/');
  }

  async updateSettings(settings: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> {
    return this.request<SystemSettings>('/settings/', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }

  // Devices
  async getDevices() {
    return this.request<any[]>('/monitoring/devices/');
  }

  async getDeviceStatus(deviceId: string) {
    return this.request<any>(`/monitoring/devices/${deviceId}/status/`);
  }

  async updateDeviceStatus(deviceId: string, status: string) {
    return this.request<any>(`/monitoring/devices/${deviceId}/status/`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
}

export const apiService = new ApiService();
