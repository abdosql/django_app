import React from 'react';
import { AlertTriangle, Bell, CheckCircle, Clock } from 'lucide-react';
import { useAlerts } from '../hooks/useAlerts';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function AlertsPanel() {
  const { alerts, isLoading, error } = useAlerts();

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'severe': return 'bg-red-50 border-red-200 text-red-700';
      case 'critical': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'normal': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-red-500">
          <AlertTriangle className="h-6 w-6 mb-2" />
          <p>Error loading alerts</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Temperature Alerts</h2>
        <div className="relative">
          <Bell className="h-6 w-6 text-indigo-500" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No Active Alerts</p>
            <p className="text-sm text-gray-500 mt-1">
              All systems are operating within normal parameters
            </p>
          </div>
        ) : (
          alerts.map(alert => (
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
                  <div className="flex items-center text-sm mt-1 opacity-75">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Active Alerts: {alerts.length}</span>
            <button 
              className="text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => window.location.href = '/alerts'}
            >
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 