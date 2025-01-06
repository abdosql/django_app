import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle, Clock } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useAlerts } from '../hooks/useAlerts';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

interface Alert {
  id: number;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  device: {
    id: number;
    name: string;
    location: string;
  };
  consecutiveCount: number;
  temperature?: number;
  is_resolved: boolean;
}

export default function AlertsPanel() {
  const navigate = useNavigate();
  const { alerts, isLoading, error, hasMore, loadMore, totalCount } = useAlerts(10);
  const [errorState, setErrorState] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'severe': return 'bg-red-50 border-red-200 text-red-700';
      case 'critical': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'normal': return 'bg-green-50 border-green-200 text-green-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const TemperatureThresholdIndicator = ({ temperature }: { temperature: number }) => {
    const getThresholdColor = (temp: number) => {
      if (temp < 0 || temp > 10) return 'bg-red-500';
      if (temp < 2 || temp > 8) return 'bg-orange-500';
      return 'bg-green-500';
    };

    const getThresholdText = (temp: number) => {
      if (temp < 0 || temp > 10) return 'Severe';
      if (temp < 2 || temp > 8) return 'Critical';
      return 'Normal';
    };

    return (
      <div className="flex items-center space-x-2 mt-1">
        <div className={`h-2 w-2 rounded-full ${getThresholdColor(temperature)}`} />
        <span className="text-sm font-medium">
          {temperature.toFixed(1)}°C
        </span>
        <span className={`text-sm ${
          temperature < 0 || temperature > 10 ? 'text-red-600' :
          temperature < 2 || temperature > 8 ? 'text-orange-600' :
          'text-gray-600'
        }`}>
          ({getThresholdText(temperature)})
        </span>
      </div>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return timestamp;
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      const response = await apiService.acknowledgeAlert(alertId);
      if (response.error) throw new Error(response.error);
    } catch (error) {
      if (error instanceof Error) {
        setErrorState(error.message);
      }
    }
  };

  const handleCreateIncident = async (alert: Alert) => {
    try {
      const response = await apiService.createIncident({
        alert_id: alert.id,
        description: `Incident created from ${alert.type} alert: ${alert.message}`,
        device_id: alert.device.id.toString(),
      });
      
      if (response.error) throw new Error(response.error);
      
      navigate(`/incidents/${response.data.id}`);
    } catch (error) {
      if (error instanceof Error) {
        setErrorState(error.message);
      }
    }
  };

  if (isLoading && alerts.length === 0) {
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
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No Active Alerts</p>
            <p className="text-sm text-gray-500 mt-1">
              All systems are operating within normal parameters
            </p>
          </div>
        ) : (
          <>
            {alerts.map(alert => (
              <Link 
                to={`/incidents/${alert.id}`}
                key={alert.id}
                className={`p-4 rounded-lg border ${getAlertColor(alert.type)} hover:opacity-90 transition-opacity`}
              >
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {alert.type === 'high_temperature' ? 'Temperature High Alert' : 
                       alert.type === 'low_temperature' ? 'Temperature Low Alert' : 
                       'Temperature Alert'}
                    </p>
                    {alert.temperature && (
                      <TemperatureThresholdIndicator temperature={alert.temperature} />
                    )}
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
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAcknowledge(alert.id);
                        }}
                        className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleCreateIncident(alert);
                        }}
                        className="px-2 py-1 text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        Create Incident
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {hasMore && (
              <div ref={observerTarget} className="py-4">
                {isLoading && (
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Active Alerts: {totalCount}</span>
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