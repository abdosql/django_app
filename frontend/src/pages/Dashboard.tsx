import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AlertTriangle, RefreshCw, ChevronDown, Computer } from 'lucide-react';
import TemperatureCard from '../components/TemperatureCard';
import TemperatureGraph from '../components/TemperatureGraph';
import SystemStatus from '../components/SystemStatus';
import AlertsPanel from '../components/AlertsPanel';
import ChatbotButton from '../components/ChatbotButton';
import { useTemperatureReadings } from '../hooks/useTemperatureReadings';
import { useDevices } from '../hooks/useDevices';

const REFRESH_INTERVAL = 20000;

export default function Dashboard() {
  const navigate = useNavigate();
  const { devices, selectedDevice, setSelectedDevice, isLoading: devicesLoading } = useDevices();
  const {
    currentTemperature,
    maxTemperature,
    minTemperature,
    trend,
    isLoading,
    error,
    humidity,
    powerStatus,
    batteryLevel,
    refetch
  } = useTemperatureReadings(selectedDevice || undefined);

  const handleDeviceChange = useCallback((deviceId: string) => {
    console.log('Dashboard: Changing device to:', deviceId);
    setSelectedDevice(deviceId);
    // Force a data refresh when device changes
    refetch();
  }, [setSelectedDevice, refetch]);

  useEffect(() => {
    console.log('Dashboard: Current selected device:', selectedDevice);
  }, [selectedDevice]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refetch]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (devicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No Devices Found</h2>
          <p className="text-gray-600 mb-4">Please add a device to start monitoring temperature.</p>
          <button
            onClick={() => navigate('/devices')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Device
          </button>
        </div>
      </div>
    );
  }

  const selectedDeviceData = devices.find(device => device.device_id === selectedDevice);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          {isLoading && (
            <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
          )}
          <div className="relative">
            <div className="inline-flex items-center">
              <Computer className="h-5 w-5 text-gray-500 mr-2" />
              <select
                value={selectedDevice || ''}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="block w-72 rounded-lg border-gray-300 bg-white py-2 pl-3 pr-10 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ appearance: 'none' }}
              >
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.name} ({device.location}) - {device.status}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/export')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TemperatureCard
          current={currentTemperature}
          max={maxTemperature}
          min={minTemperature}
          trend={trend}
          isLoading={isLoading}
          error={error}
        />
        <div className="md:col-span-2">
          <SystemStatus 
            humidity={humidity}
            powerStatus={powerStatus}
            batteryLevel={batteryLevel}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <TemperatureGraph deviceId={selectedDevice || undefined} />
        </div>
        <AlertsPanel deviceId={selectedDevice || undefined} />
      </div>
      <ChatbotButton
        currentTemperature={currentTemperature}
        maxTemperature={maxTemperature}
        minTemperature={minTemperature}
        trend={trend}
        humidity={humidity}
        powerStatus={powerStatus}
        batteryLevel={batteryLevel}
        deviceId={selectedDevice || undefined}
      />
    </>
  );
}