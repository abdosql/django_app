import React from 'react';
import { Settings, User, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const navigate = useNavigate();

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

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 animate-fadeIn">
      {/* Profile Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-medium text-gray-900">John Doe</p>
        <p className="text-sm text-gray-500">john.doe@example.com</p>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
          Admin Operator
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
          onClick={() => {
            // Handle logout here
            onClose();
          }}
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
} 