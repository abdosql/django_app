import React from 'react';
import { Battery, Signal, Power, Droplets, BatteryCharging } from 'lucide-react';

interface SystemStatusProps {
  humidity: number;
  powerStatus: boolean;
  batteryLevel: number;
}

interface StatusGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  icon: React.ReactNode;
  unit?: string;
  color?: string;
}

function StatusGauge({ value, maxValue, label, icon, unit, color = "bg-indigo-500" }: StatusGaugeProps) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        {icon}
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 text-right text-sm font-medium text-gray-700">
        {value}{unit}
      </div>
    </div>
  );
}

function PowerStatusCard({ powerStatus }: { powerStatus: boolean }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">
          {powerStatus ? "Main Power" : "Battery Power"}
        </span>
        {powerStatus ? (
          <Power className="h-5 w-5 text-green-500" />
        ) : (
          <BatteryCharging className="h-5 w-5 text-yellow-500" />
        )}
      </div>
      <div className="mt-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {powerStatus ? 'Connected to main power' : 'Running on battery power'}
          </span>
          <span className={`text-sm font-medium ${powerStatus ? 'text-green-600' : 'text-yellow-600'}`}>
            {powerStatus ? 'Active' : 'Active (Battery)'}
          </span>
        </div>
      </div>
    </div>
  );
}

function BatteryStatusCard({ batteryLevel }: { batteryLevel: number }) {
  const getBatteryColor = () => {
    if (batteryLevel > 50) return 'text-green-500';
    if (batteryLevel > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBatteryBarColor = () => {
    if (batteryLevel > 50) return 'bg-green-500';
    if (batteryLevel > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getBatteryStatus = () => {
    if (batteryLevel > 50) return 'Good';
    if (batteryLevel > 20) return 'Low';
    return 'Critical';
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Battery Status</span>
        <Battery className={`h-5 w-5 ${getBatteryColor()}`} />
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${getBatteryBarColor()} transition-all duration-500 ease-out`}
          style={{ width: `${batteryLevel}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between items-center">
        <span className={`text-sm font-medium ${getBatteryColor()}`}>
          {getBatteryStatus()}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {batteryLevel.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export default function SystemStatus({ humidity, powerStatus, batteryLevel }: SystemStatusProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <PowerStatusCard 
        powerStatus={powerStatus}
      />
      <BatteryStatusCard 
        batteryLevel={batteryLevel}
      />
      <StatusGauge
        value={humidity}
        maxValue={100}
        label="Humidity"
        icon={<Droplets className="h-5 w-5 text-cyan-500" />}
        unit="%"
        color="bg-cyan-500"
      />
      <StatusGauge
        value={100}
        maxValue={100}
        label="Signal Strength"
        icon={<Signal className="h-5 w-5 text-blue-500" />}
        unit="%"
        color="bg-blue-500"
      />
    </div>
  );
}