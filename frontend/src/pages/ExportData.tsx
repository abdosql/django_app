import React from 'react';
import { ExportPanel } from '../components/ExportPanel';
import { TemperatureStats } from '../components/TemperatureStats';

export default function ExportData() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Export Temperature Data</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExportPanel />
        <TemperatureStats />
      </div>
    </div>
  );
}
