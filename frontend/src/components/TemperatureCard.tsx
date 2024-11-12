import React from 'react';
import CountUp from 'react-countup';
import { Thermometer, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useSystemSettings } from '../hooks/useSystemSettings';

interface TemperatureCardProps {
  current: number;
  max: number;
  min: number;
  trend: 'up' | 'down' | 'stable';
  isLoading: boolean;
  error: string | null;
}

export default function TemperatureCard({ current, max, min, trend, isLoading, error }: TemperatureCardProps) {
  const { settings, isLoading: settingsLoading } = useSystemSettings();

  const getTrendColor = () => {
    if (trend === 'up') return 'text-red-500';
    if (trend === 'down') return 'text-blue-500';
    return 'text-gray-500';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-5 w-5" />;
    if (trend === 'down') return <TrendingDown className="h-5 w-5" />;
    return null;
  };

  const getAlertStatus = () => {
    if (current < settings.critical_temp_min || current > settings.critical_temp_max) {
      return 'severe';
    }
    if (current < settings.normal_temp_min || current > settings.normal_temp_max) {
      return 'critical';
    }
    return 'normal';
  };

  const getStatusColor = () => {
    const status = getAlertStatus();
    if (status === 'severe') return 'text-red-600 bg-red-50';
    if (status === 'critical') return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  if (isLoading || settingsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-red-500">
          <AlertTriangle className="h-6 w-6 mb-2" />
          <p>Error loading temperature data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Current Temperature</h2>
        <Thermometer className="h-6 w-6 text-indigo-500" />
      </div>
      
      <div className="flex items-end space-x-2 mb-4">
        <span className="text-4xl font-bold">
          <CountUp end={current} decimals={1} duration={2} />°C
        </span>
        <span className={`flex items-center ${getTrendColor()}`}>
          {getTrendIcon()}
        </span>
      </div>

      <div className={`flex items-center p-2 rounded-lg mb-4 ${getStatusColor()}`}>
        <AlertTriangle className="h-4 w-4 mr-2" />
        <span className="text-sm font-medium">
          {getAlertStatus() === 'normal' ? 'Temperature Normal' : `${getAlertStatus().charAt(0).toUpperCase() + getAlertStatus().slice(1)} Alert`}
        </span>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <div className="flex items-center">
          <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
          <span>{max}°C Max</span>
        </div>
        <div className="flex items-center">
          <TrendingDown className="h-4 w-4 text-blue-500 mr-1" />
          <span>{min}°C Min</span>
        </div>
      </div>

      {/* Temperature Ranges Legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-green-600">
            Normal: {settings.normal_temp_min}°C - {settings.normal_temp_max}°C
          </div>
          <div className="text-orange-600">
            Critical: {settings.critical_temp_min}°C - {settings.critical_temp_max}°C
          </div>
          <div className="text-red-600">
            Severe: &lt;{settings.critical_temp_min}°C, &gt;{settings.critical_temp_max}°C
          </div>
        </div>
      </div>
    </div>
  );
}