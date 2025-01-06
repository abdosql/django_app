import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Clock, Thermometer } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const { notifications, unreadCount, isLoading, error, markAsRead } = useNotifications();

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'temp_high':
      case 'high_temperature':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'temp_warning':
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'temp_low':
      case 'low_temperature':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string, severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return 'bg-red-50 hover:bg-red-100';
      case 'critical':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'warning':
        return 'bg-yellow-50 hover:bg-yellow-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  const formatTemperature = (temperature: number) => {
    return (
      <div className="flex items-center mt-1 text-xs">
        <Thermometer className="h-3 w-3 mr-1" />
        <span className={`font-medium ${
          temperature < 0 || temperature > 10 ? 'text-red-600' :
          temperature < 2 || temperature > 8 ? 'text-orange-600' :
          'text-green-600'
        }`}>
          {temperature}°C
        </span>
        <span className="ml-1 text-gray-500">
          {temperature < 0 || temperature > 10 ? '(Severe)' :
           temperature < 2 || temperature > 8 ? '(Critical)' :
           '(Normal)'}
        </span>
      </div>
    );
  };

  return (
    <div 
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 ${getNotificationColor(notification.alert.type, notification.alert.severity)} ${
                  notification.status !== 'READ' ? 'bg-opacity-50' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  {getNotificationIcon(notification.alert.type)}
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.alert.message}
                      </p>
                      {notification.status === 'READ' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {notification.alert.temperature && (
                      formatTemperature(notification.alert.temperature)
                    )}
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                      </div>
                      {notification.alert.device && (
                        <span className="text-gray-400">
                          {notification.alert.device.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => window.location.href = '/notifications'}
          className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View All Notifications
        </button>
      </div>
    </div>
  );
} 