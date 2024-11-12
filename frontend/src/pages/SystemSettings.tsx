import React, { useState, useEffect } from 'react';
import { Thermometer, Clock, Bell, Shield } from 'lucide-react';
import FlashMessage from '../components/FlashMessage';

interface SystemSettings {
  normal_temp_min: number;
  normal_temp_max: number;
  critical_temp_min: number;
  critical_temp_max: number;
  reading_interval: number;
  alert_reset_time: number;
  require_2fa: boolean;
}

interface FlashState {
  message: string;
  type: 'success' | 'error';
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    normal_temp_min: 2.0,
    normal_temp_max: 8.0,
    critical_temp_min: 0.0,
    critical_temp_max: 10.0,
    reading_interval: 20,
    alert_reset_time: 30,
    require_2fa: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const response = await fetch('/api/settings/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setFlash({
          type: 'error',
          message: error instanceof Error ? error.message : 'Failed to load settings'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/api/settings/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);
      setFlash({
        type: 'success',
        message: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      setFlash({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update settings'
      });
    } finally {
      setIsSaving(false);
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

      <div className="px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Configure temperature thresholds and system parameters</p>
      </div>

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
                    value={settings.normal_temp_min}
                    onChange={(e) => setSettings({ ...settings, normal_temp_min: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Max (°C)"
                    value={settings.normal_temp_max}
                    onChange={(e) => setSettings({ ...settings, normal_temp_max: parseFloat(e.target.value) })}
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
                    value={settings.critical_temp_min}
                    onChange={(e) => setSettings({ ...settings, critical_temp_min: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="number"
                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Max (°C)"
                    value={settings.critical_temp_max}
                    onChange={(e) => setSettings({ ...settings, critical_temp_max: parseFloat(e.target.value) })}
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
                  value={settings.reading_interval}
                  onChange={(e) => setSettings({ ...settings, reading_interval: parseInt(e.target.value) })}
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
                  value={settings.alert_reset_time}
                  onChange={(e) => setSettings({ ...settings, alert_reset_time: parseInt(e.target.value) })}
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
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.require_2fa}
                  onChange={(e) => setSettings({ ...settings, require_2fa: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
} 