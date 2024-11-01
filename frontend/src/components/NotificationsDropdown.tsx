import React from 'react';
import { Bell, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: {
    id: number;
    message: string;
    time: string;
    isRead: boolean;
    type?: 'alert' | 'info' | 'success';
  }[];
}

export default function NotificationsDropdown({ isOpen, onClose, notifications }: NotificationsDropdownProps) {
  if (!isOpen) return null;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 animate-fadeIn">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {notifications.filter(n => !n.isRead).length} new
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No notifications
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-3 hover:bg-gray-50 ${
                !notification.isRead ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="ml-3 w-0 flex-1">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {notification.time}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-3">
        <button
          onClick={() => {
            // Handle marking all as read
            onClose();
          }}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500 w-full text-center"
        >
          Mark all as read
        </button>
      </div>
    </div>
  );
} 