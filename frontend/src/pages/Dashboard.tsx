import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, AlertTriangle, RefreshCw } from 'lucide-react';
import TemperatureCard from '../components/TemperatureCard';
import TemperatureGraph from '../components/TemperatureGraph';
import SystemStatus from '../components/SystemStatus';
import AlertsPanel from '../components/AlertsPanel';
import { useTemperatureReadings } from '../hooks/useTemperatureReadings';

const REFRESH_INTERVAL = 20000; // 20 seconds

export default function Dashboard() {
  const navigate = useNavigate();
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
  } = useTemperatureReadings();

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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold text-gray-900 mr-4">Dashboard</h1>
          {isLoading && (
            <RefreshCw className="h-5 w-5 text-gray-400 animate-spin" />
          )}
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
          <TemperatureGraph />
        </div>
        <AlertsPanel />
      </div>
    </>
  );
}