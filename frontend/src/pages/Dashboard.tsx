import React from 'react';
import TemperatureCard from '../components/TemperatureCard';
import TemperatureGraph from '../components/TemperatureGraph';
import SystemStatus from '../components/SystemStatus';
import AlertsPanel from '../components/AlertsPanel';

export default function Dashboard() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TemperatureCard
          current={5.5}
          max={6.2}
          min={4.8}
          trend="up"
        />
        <div className="md:col-span-2">
          <SystemStatus />
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