import React from 'react';
import { Battery, Signal, Power, Droplets } from 'lucide-react';

interface StatusGaugeProps {
  value: number;
  maxValue: number;
  label: string;
  icon: React.ReactNode;
  unit?: string;
}

function StatusGauge({ value, maxValue, label, icon, unit }: StatusGaugeProps) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        {icon}
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1 text-right text-sm font-medium text-gray-700">
        {value}{unit}
      </div>
    </div>
  );
}

export default function SystemStatus() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatusGauge
        value={85}
        maxValue={100}
        label="Battery"
        icon={<Battery className="h-5 w-5 text-green-500" />}
        unit="%"
      />
      <StatusGauge
        value={65}
        maxValue={100}
        label="Signal Strength"
        icon={<Signal className="h-5 w-5 text-blue-500" />}
        unit=" dBm"
      />
      <StatusGauge
        value={100}
        maxValue={100}
        label="Power Status"
        icon={<Power className="h-5 w-5 text-yellow-500" />}
        unit="%"
      />
      <StatusGauge
        value={45}
        maxValue={100}
        label="Humidity"
        icon={<Droplets className="h-5 w-5 text-cyan-500" />}
        unit="%"
      />
    </div>
  );
}