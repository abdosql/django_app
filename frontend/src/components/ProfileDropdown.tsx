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

  const menuItems = [
    {
      icon: <User className="w-4 h-4" />,
      label: 'My Profile',
      description: 'Manage your account settings',
      path: '/profile'
    },
    {
      icon: <Shield className="w-4 h-4" />,
      label: 'Operator Settings',
      description: 'Configure notification rules',
      path: '/operator-settings'
    },
    {
      icon: <Settings className="w-4 h-4" />,
      label: 'System Settings',
      description: 'Configure temperature thresholds',
      path: '/system-settings'
    },
  ];

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
    if (user?.is_staff) return 'Admin';
    if (user?.is_operator) return 'Operator';
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
            className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150"
            onClick={() => handleNavigation(item.path)}
          >
            <div className="flex items-center">
              <span className="text-gray-500">{item.icon}</span>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div className="border-t border-gray-100">
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
} 