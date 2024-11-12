import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Legend,
} from 'recharts';
import { useHistoricalReadings } from '../hooks/useHistoricalReadings';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { AlertTriangle } from 'lucide-react';

export default function TemperatureGraph() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { readings, isLoading, error } = useHistoricalReadings(timeRange);
  const { settings } = useSystemSettings();

  const formatData = (readings: any[]) => {
    return readings.map(reading => ({
      time: new Date(reading.timestamp).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short'
      }),
      temperature: reading.temperature,
      humidity: reading.humidity
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-sm font-semibold text-indigo-600">
            Temperature: {payload[0].value.toFixed(1)}°C
          </p>
          <p className="text-sm font-semibold text-cyan-600">
            Humidity: {payload[1].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-[400px] bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-red-500">
          <AlertTriangle className="h-6 w-6 mb-2" />
          <p>Error loading graph data</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const data = formatData(readings);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Temperature & Humidity History</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1 rounded-md text-sm ${
              timeRange === '24h'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1 rounded-md text-sm ${
              timeRange === '7d'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 rounded-md text-sm ${
              timeRange === '30d'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            30d
          </button>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12 }}
              interval={timeRange === '24h' ? 3 : timeRange === '7d' ? 23 : 119}
            />
            <YAxis
              yAxisId="temp"
              domain={[
                Math.min(settings.critical_temp_min - 2, 0),
                Math.max(settings.critical_temp_max + 2, 12)
              ]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="humidity"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }}
            />
            
            {/* Temperature threshold areas */}
            <ReferenceArea
              y1={settings.normal_temp_max}
              y2={settings.critical_temp_max}
              yAxisId="temp"
              fill="#fef3c7"
              fillOpacity={0.3}
            />
            <ReferenceArea
              y1={settings.critical_temp_min}
              y2={settings.normal_temp_min}
              yAxisId="temp"
              fill="#fef3c7"
              fillOpacity={0.3}
            />
            <ReferenceArea
              y1={settings.normal_temp_min}
              y2={settings.normal_temp_max}
              yAxisId="temp"
              fill="#dcfce7"
              fillOpacity={0.3}
            />
            
            {/* Critical threshold lines */}
            <ReferenceLine
              y={settings.normal_temp_min}
              yAxisId="temp"
              stroke="#f59e0b"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={settings.normal_temp_max}
              yAxisId="temp"
              stroke="#f59e0b"
              strokeDasharray="3 3"
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
              name="Temperature"
            />
            <Line
              yAxisId="humidity"
              type="monotone"
              dataKey="humidity"
              stroke="#0891b2"
              strokeWidth={2}
              dot={false}
              name="Humidity"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">Normal Range</p>
          <p className="text-xs text-green-600">
            {settings.normal_temp_min}°C - {settings.normal_temp_max}°C
          </p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-700">Critical Range</p>
          <p className="text-xs text-amber-600">
            {settings.critical_temp_min}°C - {settings.normal_temp_min}°C,{' '}
            {settings.normal_temp_max}°C - {settings.critical_temp_max}°C
          </p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">Severe Range</p>
          <p className="text-xs text-red-600">
            &lt;{settings.critical_temp_min}°C, &gt;{settings.critical_temp_max}°C
          </p>
        </div>
      </div>
    </div>
  );
}