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

interface DataPoint {
  time: string;
  temperature: number;
  humidity: number;
}

export default function TemperatureGraph() {
  const [timeRange, setTimeRange] = useState('24h');
  
  // Generate sample data
  const generateData = () => {
    const now = new Date();
    const data: DataPoint[] = [];
    const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720; // 24h, 7d, or 30d

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 3600000)); // hourly data points
      data.push({
        time: time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          day: 'numeric',
          month: 'short'
        }),
        temperature: 4 + Math.sin(i / 8) * 2 + Math.random(), // Simulate temperature fluctuation
        humidity: 45 + Math.cos(i / 12) * 10 + Math.random() * 5, // Simulate humidity fluctuation
      });
    }
    return data;
  };

  const data = generateData();

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
              domain={[-2, 12]}
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
              y1={8}
              y2={10}
              yAxisId="temp"
              fill="#fef3c7"
              fillOpacity={0.3}
            />
            <ReferenceArea
              y1={0}
              y2={2}
              yAxisId="temp"
              fill="#fef3c7"
              fillOpacity={0.3}
            />
            <ReferenceArea
              y1={2}
              y2={8}
              yAxisId="temp"
              fill="#dcfce7"
              fillOpacity={0.3}
            />
            
            {/* Critical threshold lines */}
            <ReferenceLine
              y={2}
              yAxisId="temp"
              stroke="#f59e0b"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={8}
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
          <p className="text-xs text-green-600">2°C - 8°C</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-700">Critical Range</p>
          <p className="text-xs text-amber-600">0°C - 2°C, 8°C - 10°C</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">Severe Range</p>
          <p className="text-xs text-red-600">&lt; 0°C, &gt; 10°C</p>
        </div>
      </div>
    </div>
  );
}