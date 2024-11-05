import React from 'react';
import TemperatureCard from '../components/TemperatureCard';
import TemperatureGraph from '../components/TemperatureGraph';
import SystemStatus from '../components/SystemStatus';
import AlertsPanel from '../components/AlertsPanel';
import { useTemperatureReadings } from '../hooks/useTemperatureReadings';

export default function Dashboard() {
  const {
    currentTemperature,
    maxTemperature,
    minTemperature,
    trend,
    isLoading,
    error,
    humidity,
    powerStatus,
    batteryLevel
  } = useTemperatureReadings();

  return (
    <>
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