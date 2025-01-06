import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { apiService } from '../services/api.service';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TemperatureStats {
  labels: string[];
  temperatures: number[];
  min_temp: number;
  max_temp: number;
  avg_temp: number;
}

export const TemperatureStats: React.FC = () => {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [stats, setStats] = useState<TemperatureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await apiService.getTemperatureStats(period);
        if (response.error) throw new Error(response.error);
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!stats) {
    return <div>No data available</div>;
  }

  const chartData: ChartData<'line'> = {
    labels: stats.labels.map(t => new Date(t).toLocaleString()),
    datasets: [
      {
        label: 'Temperature',
        data: stats.temperatures,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
      }
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Temperature Statistics',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as '24h' | '7d' | '30d')}
          className="p-2 border rounded"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Minimum Temperature</h3>
          <p className="text-2xl">{stats.min_temp.toFixed(1)}°C</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Average Temperature</h3>
          <p className="text-2xl">{stats.avg_temp.toFixed(1)}°C</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Maximum Temperature</h3>
          <p className="text-2xl">{stats.max_temp.toFixed(1)}°C</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};
