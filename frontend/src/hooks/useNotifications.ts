import { useState, useEffect } from 'react';

interface Operator {
  id: number;
  name: string;
  priority: string;
}

interface Alert {
  id: number;
  type: string;
  severity: string;
  message: string;
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
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/api/notifications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/api/notifications/unread_count/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`/api/notifications/${notificationId}/read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    refresh: fetchData
  };
} 