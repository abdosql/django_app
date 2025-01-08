import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Operator, OperatorFormData } from '../types/operator';

interface EditOperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: number, operatorData: Partial<OperatorFormData>) => Promise<void>;
  operator: Operator | null;
}

export default function EditOperatorModal({ isOpen, onClose, onEdit, operator }: EditOperatorModalProps) {
  const [formData, setFormData] = useState<OperatorFormData>({
    name: '',
    email: '',
    telegram_id: '',
    is_active: true,
    priority: 1,
    notification_preferences: {
      email_enabled: true,
      telegram_enabled: false,
      phone_enabled: false,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (operator) {
      console.log('Setting operator data:', operator);
      setFormData({
        name: operator.name || '',
        email: operator.user_email || '',
        telegram_id: operator.telegram_id || '',
        is_active: operator.is_active,
        priority: operator.priority,
        notification_preferences: operator.notification_preferences || {
          email_enabled: false,
          telegram_enabled: false,
          phone_enabled: false,
        },
      });
    }
  }, [operator]);

  if (!isOpen || !operator) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updateData: Partial<OperatorFormData> = {
        name: formData.name,
        email: formData.email !== operator.user_email ? formData.email : undefined,
        telegram_id: formData.telegram_id,
        is_active: formData.is_active,
        priority: formData.priority,
        notification_preferences: formData.notification_preferences,
      };
      
      // Remove undefined fields
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined)
      ) as Partial<OperatorFormData>;
      
      console.log('Sending update data:', cleanedData);
      await onEdit(operator.id, cleanedData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Operator</h3>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Telegram ID (Optional)</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.telegram_id}
                    onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  >
                    <option value={1}>Primary</option>
                    <option value={2}>Secondary</option>
                    <option value={3}>Tertiary</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label className="ml-2 block text-sm text-gray-900">Active</label>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-gray-700">Notification Preferences</legend>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={formData.notification_preferences.email_enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        notification_preferences: {
                          ...formData.notification_preferences,
                          email_enabled: e.target.checked
                        }
                      })}
                    />
                    <label className="ml-2 block text-sm text-gray-900">Email notifications</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={formData.notification_preferences.telegram_enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        notification_preferences: {
                          ...formData.notification_preferences,
                          telegram_enabled: e.target.checked
                        }
                      })}
                    />
                    <label className="ml-2 block text-sm text-gray-900">Telegram notifications</label>
                  </div>
                </fieldset>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notification Threshold</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.notification_threshold || 1}
                    onChange={(e) => setFormData({ ...formData, notification_threshold: Number(e.target.value) })}
                  >
                    <option value={1}>Low (Primary Only)</option>
                    <option value={4}>Medium (Primary & Secondary)</option>
                    <option value={7}>High (All Operators)</option>
                  </select>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 