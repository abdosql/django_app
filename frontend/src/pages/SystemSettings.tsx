import React from 'react';
import { Thermometer, Clock, Bell, Shield } from 'lucide-react';

export default function SystemSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure temperature thresholds and system parameters</p>
      </div>

      {/* Settings Content */}
      <div className="p-6">
        {/* Temperature Thresholds */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Temperature Thresholds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Normal Range</label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Min (°C)"
                    defaultValue={2}
                  />
                </div>
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Max (°C)"
                    defaultValue={8}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Critical Range</label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Min (°C)"
                    defaultValue={0}
                  />
                </div>
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Max (°C)"
                    defaultValue={10}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monitoring Settings */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monitoring Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Reading Interval</label>
              <div className="mt-1 flex items-center">
                <Clock className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  defaultValue="20"
                >
                  <option value="10">Every 10 minutes</option>
                  <option value="20">Every 20 minutes</option>
                  <option value="30">Every 30 minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alert Reset Time</label>
              <div className="mt-1 flex items-center">
                <Bell className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  defaultValue="30"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* System Access */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Access</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Require 2FA for Admin Access</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
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