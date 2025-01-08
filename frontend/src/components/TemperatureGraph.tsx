import React, { useState, useRef } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Legend,
  Brush,
  Area
} from 'recharts';
import { useHistoricalReadings } from '../hooks/useHistoricalReadings';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { AlertTriangle, Download, ZoomIn, ZoomOut, RefreshCw, Calendar } from 'lucide-react';
import { apiService } from '../services/api.service';
import { toast } from 'react-toastify';

interface FormattedReading {
  time: number;
  displayTime: string;
  temperature: number;
  humidity: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

interface TemperatureGraphProps {
  deviceId?: string;
}

export default function TemperatureGraph({ deviceId }: TemperatureGraphProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'custom'>('24h');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const { readings, isLoading, error, refetch } = useHistoricalReadings(
    timeRange,
    timeRange === 'custom' ? customStartDate : undefined,
    timeRange === 'custom' ? customEndDate : undefined,
    deviceId
  );
  const { settings } = useSystemSettings();

  console.log('TemperatureGraph render:', {
    timeRange,
    readingsCount: readings?.length,
    isLoading,
    error,
    settings
  });

  // Zoom state
  const [zoomLeft, setZoomLeft] = useState<number | null>(null);
  const [zoomRight, setZoomRight] = useState<number | null>(null);
  const [isZooming, setIsZooming] = useState(false);
  const zoomRef = useRef<{ left: number; right: number } | null>(null);
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);

  const formatData = (readings: any[] | undefined): FormattedReading[] => {
    if (!readings || readings.length === 0) {
      console.log('No readings data available');
      return [];
    }
    
    console.log('Raw readings:', readings);
    
    const formattedData = readings.map(reading => {
      const timestamp = new Date(reading.timestamp).getTime();
      console.log('Processing reading:', {
        original: reading.timestamp,
        parsed: new Date(reading.timestamp),
        timestamp,
        temperature: reading.temperature,
        humidity: reading.humidity
      });
      
      return {
        time: timestamp,
        displayTime: new Date(reading.timestamp).toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          day: 'numeric',
          month: 'short'
        }),
        temperature: reading.temperature,
        humidity: reading.humidity
      };
    });

    console.log('Formatted data:', formattedData);
    return formattedData;
  };

  const handleZoomStart = (e: any) => {
    if (!isZooming || !e) return;
    // Get the time value from the chart coordinates
    const { chartX, xAxisMap } = e;
    if (xAxisMap && xAxisMap[0]) {
      const timeValue = xAxisMap[0].scale.invert(chartX);
      setZoomLeft(timeValue);
    }
  };

  const handleZoomMove = (e: any) => {
    if (!isZooming || !zoomLeft || !e) return;
    // Get the time value from the chart coordinates
    const { chartX, xAxisMap } = e;
    if (xAxisMap && xAxisMap[0]) {
      const timeValue = xAxisMap[0].scale.invert(chartX);
      setZoomRight(timeValue);
    }
  };

  const handleZoomEnd = () => {
    if (!isZooming || !zoomLeft || !zoomRight) {
      setZoomLeft(null);
      setZoomRight(null);
      return;
    }

    const [startTime, endTime] = [zoomLeft, zoomRight].sort((a, b) => a - b);
    
    // Only zoom if the selection is meaningful (more than 1 minute)
    if (Math.abs(startTime - endTime) > 60000) {
      setZoomDomain([startTime, endTime]);
      zoomRef.current = { left: startTime, right: endTime };
    }

    setZoomLeft(null);
    setZoomRight(null);
    setIsZooming(false);
  };

  const handleResetZoom = () => {
    zoomRef.current = null;
    setZoomDomain(null);
    setIsZooming(false);
  };

  const handleExportData = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      // First check if we have any data to export
      if (!readings || readings.length === 0) {
        toast.warn('No data available for the selected time range');
        return;
      }

      let startDate: Date;
      let endDate: Date;

      if (timeRange === 'custom' && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
      } else {
        // For non-custom ranges, calculate the date range based on timeRange
        endDate = new Date();
        startDate = new Date();
        if (timeRange === '24h') {
          startDate.setHours(startDate.getHours() - 24);
        } else if (timeRange === '7d') {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeRange === '30d') {
          startDate.setDate(startDate.getDate() - 30);
        }
      }

      // Always use port 8000 for backend requests
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      const exportUrl = `http://localhost:8000/api/monitoring/readings/export/?${params.toString()}`;

      // Fetch the data with only authorization header, matching the curl command
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
        }
      });

      if (response.status === 404) {
        toast.warn('No readings found for the selected time range');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Get the response data
      let blob;
      if (format === 'json') {
        // If JSON is requested, parse the CSV and convert to JSON
        const text = await response.text();
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        const jsonData = rows.slice(1)
          .filter(row => row.trim())
          .map(row => {
            const values = row.split(',');
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = values[index]?.trim();
            });
            return obj;
          });
        blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      } else if (format === 'pdf') {
        // For PDF, you might want to use a library like jsPDF to convert CSV to PDF
        // For now, we'll just show a message that PDF is not supported
        toast.warn('PDF export is not supported yet');
        return;
      } else {
        // For CSV, use the response directly
        blob = await response.blob();
      }

      // Trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `temperature_readings.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  const handleTimeRangeChange = (newRange: '24h' | '7d' | '30d') => {
    setTimeRange(newRange);
    setCustomStartDate('');
    setCustomEndDate('');
    setShowDatePicker(false);
    handleResetZoom();
  };

  const handleCustomDateRange = () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both start and end dates');
      return;
    }
    setTimeRange('custom');
    setShowDatePicker(false);
    handleResetZoom();
  };

  const data = formatData(readings);

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
          <p className="text-sm text-gray-600">
            {new Date(Number(label)).toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short'
            })}
          </p>
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
          <button
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-gray-500 text-center py-8">
          <p>No temperature data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-800">Temperature & Humidity History</h2>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <button
              onClick={() => handleTimeRangeChange('24h')}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === '24h'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              24h
            </button>
            <button
              onClick={() => handleTimeRangeChange('7d')}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === '7d'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              7d
            </button>
            <button
              onClick={() => handleTimeRangeChange('30d')}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === '30d'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              30d
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={`px-3 py-1 rounded-md text-sm flex items-center ${
                  timeRange === 'custom'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Custom
              </button>
              {showDatePicker && (
                <div className="absolute top-10 right-0 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="datetime-local"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date</label>
                      <input
                        type="datetime-local"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <button
                      onClick={handleCustomDateRange}
                      className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm hover:bg-indigo-700"
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-2 border-l pl-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsZooming(!isZooming)}
                className={`p-1.5 rounded-md text-gray-600 hover:bg-gray-100 ${
                  isZooming ? 'bg-gray-100' : ''
                }`}
                title={isZooming ? 'Disable Zoom' : 'Enable Zoom'}
              >
                {isZooming ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </button>
              {zoomDomain && (
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
                  title="Reset Zoom"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
                title="Export Data"
              >
                <Download className="h-4 w-4" />
              </button>
              {showExportMenu && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1"
                  style={{ minWidth: '150px' }}
                >
                  <button
                    onClick={() => handleExportData('csv')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExportData('json')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExportData('pdf')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Export as PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onMouseDown={handleZoomStart}
            onMouseMove={handleZoomMove}
            onMouseUp={handleZoomEnd}
            onMouseLeave={() => {
              setZoomLeft(null);
              setZoomRight(null);
              setIsZooming(false);
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              type="number"
              scale="time"
              domain={zoomDomain ? zoomDomain : ['auto', 'auto']}
              tickFormatter={(value) => {
                try {
                  const date = new Date(value);
                  return date.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  });
                } catch (err) {
                  console.error('Error formatting tick:', err);
                  return '';
                }
              }}
            />
            <YAxis
              yAxisId="temp"
              domain={[
                Math.min(settings.critical_temp_min - 2, 0),
                Math.max(settings.critical_temp_max + 2, 12)
              ]}
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="humidity"
              orientation="right"
              domain={[0, 100]}
              label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }}
            />
            
            {/* Temperature threshold areas */}
            <ReferenceArea
              yAxisId="temp"
              y1={settings.normal_temp_max}
              y2={settings.critical_temp_max}
              fill="#fef3c7"
              fillOpacity={0.3}
            />
            <ReferenceArea
              yAxisId="temp"
              y1={settings.critical_temp_min}
              y2={settings.normal_temp_min}
              fill="#fef3c7"
              fillOpacity={0.3}
            />
            <ReferenceArea
              yAxisId="temp"
              y1={settings.normal_temp_min}
              y2={settings.normal_temp_max}
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

            {/* Zoom selection area */}
            {zoomLeft && zoomRight && (
              <ReferenceArea
                x1={Math.min(zoomLeft, zoomRight)}
                x2={Math.max(zoomLeft, zoomRight)}
                strokeOpacity={0.3}
                fill="#8884d8"
                fillOpacity={0.3}
              />
            )}

            <Brush
              dataKey="time"
              height={30}
              stroke="#8884d8"
              startIndex={0}
              endIndex={data.length > 50 ? 50 : data.length - 1}
              tickFormatter={(value) => {
                try {
                  const date = new Date(value);
                  return date.toLocaleString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short'
                  });
                } catch (err) {
                  return '';
                }
              }}
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
              isAnimationActive={false}
              connectNulls
            />
            <Line
              yAxisId="humidity"
              type="monotone"
              dataKey="humidity"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Humidity"
              isAnimationActive={false}
              connectNulls
            />
          </ComposedChart>
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