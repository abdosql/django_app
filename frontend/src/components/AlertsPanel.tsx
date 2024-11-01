import React from 'react';
import { AlertTriangle, Bell, CheckCircle } from 'lucide-react';

interface Alert {
  id: number;
  type: 'severe' | 'critical' | 'normal';
  message: string;
  timestamp: string;
  consecutiveCount: number;
}

export default function AlertsPanel() {
  const alerts: Alert[] = [
    {
      id: 1,
      type: 'severe',
      message: 'Temperature above 10°C',
      timestamp: '2024-03-20 14:30',
      consecutiveCount: 7
    },
    {
      id: 2,
      type: 'critical',
      message: 'Temperature at 8.5°C',
      timestamp: '2024-03-20 14:10',
      consecutiveCount: 4
    },
    // Add more sample alerts as needed
  ];

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'severe': return 'bg-red-50 border-red-200 text-red-700';
      case 'critical': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'normal': return 'bg-green-50 border-green-200 text-green-700';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Temperature Alerts</h2>
        <Bell className="h-6 w-6 text-indigo-500" />
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <div 
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
          >
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{alert.message}</p>
                <p className="text-sm mt-1">
                  Consecutive alerts: {alert.consecutiveCount}
                  {alert.consecutiveCount >= 7 && ' - All operators notified'}
                  {alert.consecutiveCount >= 4 && alert.consecutiveCount < 7 && ' - Operators 1 & 2 notified'}
                  {alert.consecutiveCount < 4 && ' - Operator 1 notified'}
                </p>
                <p className="text-sm mt-1 opacity-75">{alert.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 