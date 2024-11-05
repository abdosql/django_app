import React, { useState, useRef, useEffect } from 'react';
import { Bell, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';
import NotificationsDropdown from './NotificationsDropdown';
import Logo from './Logo';

interface Notification {
  id: number;
  message: string;
  time: string;
  isRead: boolean;
  type?: 'alert' | 'info' | 'success';
}

export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const notifications: Notification[] = [
    {
      id: 1,
      message: "Temperature exceeded threshold",
      time: "5 minutes ago",
      isRead: false,
      type: 'alert'
    },
    {
      id: 2,
      message: "System check completed",
      time: "1 hour ago",
      isRead: false,
      type: 'success'
    },
    {
      id: 3,
      message: "Daily report generated",
      time: "2 hours ago",
      isRead: true,
      type: 'info'
    }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getUserDisplayName = () => {
    // Get user data from session storage
    const userData = sessionStorage.getItem('user_data');
    if (userData) {
      const parsedData = JSON.parse(userData);
      const firstName = parsedData.first_name || '';
      const lastName = parsedData.last_name || '';
      return `${firstName} ${lastName}`.trim() || parsedData.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Logo />
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileOpen(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 relative"
              >
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>

              <NotificationsDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={notifications}
              />
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationOpen(false);
                }}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {getUserDisplayName()}
                </span>
              </button>

              <ProfileDropdown 
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}