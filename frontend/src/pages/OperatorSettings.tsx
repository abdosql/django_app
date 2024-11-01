import React from 'react';
import { Bell, Mail, Phone, Clock, Users } from 'lucide-react';

interface OperatorConfig {
  id: number;
  name: string;
  email: string;
  phone: string;
  notificationThreshold: number;
  isActive: boolean;
}

export default function OperatorSettings() {
  const operators: OperatorConfig[] = [
    {
      id: 1,
      name: "Primary Operator",
      email: "operator1@example.com",
      phone: "+1 (555) 111-2233",
      notificationThreshold: 1,
      isActive: true
    },
    {
      id: 2,
      name: "Secondary Operator",
      email: "operator2@example.com",
      phone: "+1 (555) 444-5566",
      notificationThreshold: 4,
      isActive: true
    },
    {
      id: 3,
      name: "Emergency Operator",
      email: "operator3@example.com",
      phone: "+1 (555) 777-8899",
      notificationThreshold: 7,
      isActive: true
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Operator Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure notification rules and operator details</p>
      </div>

      {/* Operators List */}
      <div className="p-6">
        <div className="space-y-6">
          {operators.map((operator) => (
            <div key={operator.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{operator.name}</h3>
                </div>
                <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-500">Active</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={operator.isActive}
                      onChange={() => {}}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="email"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      defaultValue={operator.email}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="tel"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      defaultValue={operator.phone}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notification Threshold</label>
                  <div className="mt-1 flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-2" />
                    <select
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      defaultValue={operator.notificationThreshold}
                    >
                      <option value={1}>After 1 alert</option>
                      <option value={4}>After 4 alerts</option>
                      <option value={7}>After 7 alerts</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 