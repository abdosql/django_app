import React from 'react';
import { Settings, User, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_operator: boolean;
  is_staff: boolean;
}

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const baseMenuItems = [
    {
      icon: <User className="w-4 h-4" />,
      label: 'My Profile',
      description: 'Manage your account settings',
      path: '/profile'
    },
  ];

  const operatorMenuItems = user?.operatorId ? [
    {
      icon: <Shield className="w-4 h-4" />,
      label: 'Operator Settings',
      description: 'Configure notification rules',
      path: '/operator-settings'
    },
  ] : [];

  const adminMenuItems = user?.isStaff ? [
    {
      icon: <Settings className="w-4 h-4" />,
      label: 'System Settings',
      description: 'Configure temperature thresholds',
      path: '/system-settings'
    },
  ] : [];

  const menuItems = [...baseMenuItems, ...operatorMenuItems, ...adminMenuItems];

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    try {
      // Clear session storage
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_id');
      
      // Call logout from auth context
      await logout();
      
      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      onClose();
    }
  };

  const getUserDisplayName = () => {
    // Get user data from session storage
    const userData = sessionStorage.getItem('user_data');
    if (userData) {
      const parsedData = JSON.parse(userData);
      const firstName = parsedData.first_name || '';
      const lastName = parsedData.last_name || '';
      return `${firstName} ${lastName}`.trim() || parsedData.email.split('@')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserRole = () => {
    if (user?.isStaff) return 'Admin';
    if (user?.operatorId) return 'Operator';
    return 'Viewer';
  };

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 animate-fadeIn">
      {/* Profile Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
        <p className="text-sm text-gray-500">{user?.email}</p>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
          {getUserRole()}
        </span>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.path)}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 text-gray-400">
                {item.icon}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors duration-150 flex items-center text-red-600"
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </div>
  );
} 