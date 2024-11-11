import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Bell, Shield, Plus, UserPlus } from 'lucide-react';
import FlashMessage from '../components/FlashMessage';
import AddOperatorModal from '../components/AddOperatorModal';
import EditOperatorModal from '../components/EditOperatorModal';

interface Operator {
  id: number;
  name: string;
  user_email: string;
  telegram_id?: string;
  is_active: boolean;
  priority: number;
  priority_display: string;
  created_at: string;
  updated_at: string;
  notification_preferences?: {
    email_enabled: boolean;
    telegram_enabled: boolean;
    phone_enabled: boolean;
  };
}

interface FlashState {
  message: string;
  type: 'success' | 'error';
}

interface OperatorFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  telegram_id?: string;
  is_active: boolean;
  priority: number;
  notification_preferences: {
    email_enabled: boolean;
    telegram_enabled: boolean;
    phone_enabled: boolean;
  };
}

export default function OperatorSettings() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flash, setFlash] = useState<FlashState | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        console.log('Fetching operators with token:', token?.substring(0, 10) + '...');
        
        const response = await fetch('/api/operators/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        });

        console.log('Response status:', response.status);
        const contentType = response.headers.get('content-type');
        console.log('Response content type:', contentType);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error('Failed to fetch operators');
        }

        const data = await response.json();
        console.log('Raw operator data:', data);

        // Check if data is an array
        if (Array.isArray(data)) {
          console.log('Individual operator data:', data[0]);
          setOperators(data);
        } else if (data.results && Array.isArray(data.results)) {
          console.log('Individual operator data:', data.results[0]);
          setOperators(data.results);
        } else {
          console.error('Unexpected data format:', data);
          throw new Error('Invalid data format from server');
        }
      } catch (error) {
        console.error('Failed to fetch operators:', error);
        setFlash({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to load operators'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOperators();
  }, []);

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Primary';
      case 2:
        return 'Secondary';
      case 3:
        return 'Tertiary';
      default:
        return `Priority ${priority}`;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-green-100 text-green-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      case 3:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddOperator = async (operatorData: OperatorFormData) => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/api/operators/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: operatorData.name,
          email: operatorData.email,
          password: operatorData.password,
          phone: operatorData.phone,
          telegram_id: operatorData.telegram_id,
          is_active: operatorData.is_active,
          priority: operatorData.priority,
          notification_preferences: operatorData.notification_preferences
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add operator');
      }

      const newOperator = await response.json();
      setOperators([...operators, newOperator]);
      setFlash({
        type: 'success',
        message: 'Operator added successfully'
      });
    } catch (error) {
      console.error('Failed to add operator:', error);
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to add operator'
      });
    }
  };

  const handleEditOperator = async (id: number, operatorData: OperatorFormData) => {
    try {
      const token = sessionStorage.getItem('access_token');
      console.log('Updating operator with data:', operatorData);

      const response = await fetch(`/api/operators/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: operatorData.name,
          email: operatorData.email,
          telegram_id: operatorData.telegram_id,
          is_active: operatorData.is_active,
          priority: operatorData.priority,
          notification_preferences: operatorData.notification_preferences
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update operator');
      }

      const updatedOperator = await response.json();
      console.log('Updated operator response:', updatedOperator);
      
      setOperators(operators.map(op => op.id === id ? {
        ...updatedOperator,
        user_email: operatorData.email
      } : op));
      
      setFlash({
        type: 'success',
        message: 'Operator updated successfully'
      });
    } catch (error) {
      console.error('Failed to update operator:', error);
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update operator'
      });
    }
  };

  // Test Notification
  const handleTestNotification = async (operatorId: number) => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`/api/operators/${operatorId}/test_notification/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test notification from system'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send test notification');
      }

      setFlash({
        type: 'success',
        message: 'Test notification sent successfully'
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to send test notification'
      });
    }
  };

  // Reset Alerts
  const handleResetAlerts = async (operatorId: number) => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`/api/operators/${operatorId}/reset_alerts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset alerts');
      }

      setFlash({
        type: 'success',
        message: 'Alerts reset successfully'
      });
    } catch (error) {
      console.error('Failed to reset alerts:', error);
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reset alerts'
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {flash && (
        <FlashMessage
          message={flash.message}
          type={flash.type}
          onClose={() => setFlash(null)}
        />
      )}

      {/* Header with Add Button */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operator Settings</h1>
            <p className="mt-1 text-sm text-gray-500">Manage operators and their notification preferences</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setIsAddModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            New Operator
          </button>
        </div>
      </div>

      {/* Operators List */}
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : operators.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No operators</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new operator.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Operator
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {operators.map((operator) => (
              <div key={operator.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  {/* Left side - Profile and Info */}
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-indigo-600" />
                      </div>
                    </div>

                    {/* Info */}
                    <div>
                      {/* Name and Status */}
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {operator.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(operator.priority)}`}>
                          {getPriorityLabel(operator.priority)}
                        </span>
                        {!operator.is_active && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="mt-4 space-y-3">
                        {/* Email */}
                        <div className="flex items-center text-sm">
                          <div className="w-28 flex items-center text-gray-500">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>Email:</span>
                          </div>
                          <span className="text-gray-900">{operator.user_email}</span>
                        </div>

                        {/* Telegram - only show if exists */}
                        {operator.telegram_id && (
                          <div className="flex items-center text-sm">
                            <div className="w-28 flex items-center text-gray-500">
                              <Bell className="h-4 w-4 mr-2" />
                              <span>Telegram:</span>
                            </div>
                            <span className="text-gray-900">{operator.telegram_id}</span>
                          </div>
                        )}

                        {/* Notification Preferences - Show as a single line */}
                        <div className="flex items-center text-sm">
                          <div className="w-28 flex items-center text-gray-500">
                            <Bell className="h-4 w-4 mr-2" />
                            <span>Notifications:</span>
                          </div>
                          <div className="flex gap-2">
                            {operator.notification_preferences?.email_enabled && (
                              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                Email
                              </span>
                            )}
                            {operator.notification_preferences?.telegram_enabled && (
                              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">
                                Telegram
                              </span>
                            )}
                            {!operator.notification_preferences?.email_enabled && 
                             !operator.notification_preferences?.telegram_enabled && (
                              <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-800">
                                None
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="mt-4 flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <Shield className="h-4 w-4 mr-1" />
                          <span>Status:</span>
                          <span className={`ml-1 font-medium ${operator.is_active ? 'text-green-600' : 'text-red-600'}`}>
                            {operator.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-gray-300" />
                        <div className="flex items-center text-sm text-gray-500">
                          <span>ID:</span>
                          <span className="ml-1 font-medium text-gray-900">#{operator.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => {
                        setSelectedOperator(operator);
                        setIsEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={() => handleTestNotification(operator.id)}
                    >
                      Test Notification
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={() => handleResetAlerts(operator.id)}
                    >
                      Reset Alerts
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddOperatorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddOperator}
      />
      <EditOperatorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedOperator(null);
        }}
        onEdit={handleEditOperator}
        operator={selectedOperator}
      />
    </div>
  );
} 