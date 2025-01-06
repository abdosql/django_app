import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

interface Operator {
  id: number;
  name: string;
  priority: string;
}

interface Device {
  id: number;
  name: string;
  location: string;
}

interface Alert {
  id: number;
  type: string;
  severity: string;
  message: string;
  temperature: number;
  device: Device;
}

export interface Notification {
  id: number;
  operator: Operator;
  alert: Alert;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  sent_at: string;
  read_at: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const response = await apiService.getNotifications();
      if (response.error) {
        throw new Error(response.error);
      }
      setNotifications(response.data || []);
      setUnreadCount((response.data || []).filter(n => n.status === 'PENDING').length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      console.error('Error fetching notifications:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'READ' as const } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      console.error('Error marking notification as read:', errorMessage);
      setError(errorMessage);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  return { notifications, unreadCount, isLoading, error, markAsRead };
}