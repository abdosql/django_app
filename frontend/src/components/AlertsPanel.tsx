import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useAlerts } from '../hooks/useAlerts';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

interface Alert {
  id: number;
  alert_type: string;
  type_display: string;
  severity: 'warning' | 'critical' | 'severe';
  severity_display: string;
  message: string;
  timestamp: string;
  device: {
    device_id: string;
    name: string;
    location: string;
    status: string;
  };
  temperature: number;
  consecutive_count: number;
  resolved: boolean;
  resolved_at: string | null;
}

interface AlertsPanelProps {
  deviceId?: string;
}

export default function AlertsPanel({ deviceId }: AlertsPanelProps) {
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

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'border-l-4 border-l-red-500 bg-white';
      case 'critical': return 'border-l-4 border-l-orange-500 bg-white';
      case 'warning': return 'border-l-4 border-l-yellow-500 bg-white';
      default: return 'border-l-4 border-l-gray-500 bg-white';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'severe':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTemperatureStatus = (temp: number) => {
    if (temp < 0 || temp > 10) {
      return { text: 'Severe', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (temp < 2 || temp > 8) {
      return { text: 'Critical', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else {
      return { text: 'Normal', color: 'text-green-600', bgColor: 'bg-green-50' };
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
      toast.info('Creating incident...', { autoClose: 2000 });
      
      console.log('Alert object:', alert);
      
      if (!alert.device || !alert.device.device_id) {
        const errorMsg = 'Invalid alert data: device information is missing';
        console.error(errorMsg);
        toast.error(errorMsg);
        return;
      }
      
      console.log('Alert device:', alert.device);
      
      // Log the data we're sending
      const incidentData = {
        alert: alert.id,
        device_id: alert.device.device_id,  // Use device_id directly as it's already a string
        description: `Temperature ${alert.severity_display} incident: ${alert.temperature}°C`,
        status: 'open',
        alert_count: alert.consecutive_count || 1,
        current_escalation_level: alert.consecutive_count >= 7 ? 3 : 
                                 alert.consecutive_count >= 4 ? 2 : 1,
        start_time: new Date().toISOString()
      };
      
      console.log('Creating incident with data:', incidentData);
      
      const response = await apiService.createIncident(incidentData);
      
      if (response.error) {
        console.error('Incident creation error:', response.error);
        toast.error(`Failed to create incident: ${response.error}`);
        throw new Error(response.error);
      }
      
      toast.success('Incident created successfully');
      navigate(`/incidents/${response.data.id}`);
    } catch (err) {
      console.error('Error creating incident:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create incident';
      toast.error(errorMessage);
      setErrorState(errorMessage);
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

  return (
    <div className="bg-white shadow-sm rounded-lg flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      {/* Fixed Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Temperature Alerts</h2>
            <p className="text-sm text-gray-500 mt-1">
              Monitoring temperature anomalies and notifications
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="p-1.5 hover:bg-gray-50 rounded-md transition-colors"
              title="Refresh alerts"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#E5E7EB_transparent] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-md hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
        <div className="divide-y divide-gray-100">
          {alerts.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="text-base font-medium text-gray-900">No Active Alerts</p>
              <p className="text-sm text-gray-500">
                All systems are operating within normal parameters
              </p>
            </div>
          ) : (
            <>
              {alerts.map(alert => {
                const tempStatus = getTemperatureStatus(alert.temperature);
                return (
                  <div 
                    key={alert.id}
                    className={`${getAlertSeverityColor(alert.severity)} hover:bg-gray-50 group`}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getAlertIcon(alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900">
                              {alert.type_display}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tempStatus.bgColor} ${tempStatus.color}`}>
                              {tempStatus.text}
                            </span>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                              <p className="text-xs font-medium text-gray-500">Device</p>
                              <p className="text-sm text-gray-900">{alert.device.name}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Location</p>
                              <p className="text-sm text-gray-900">{alert.device.location}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Temperature</p>
                              <p className="text-sm text-gray-900 font-medium">{alert.temperature.toFixed(1)}°C</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">Consecutive Alerts</p>
                              <p className="text-sm text-gray-900">{alert.consecutive_count}</p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimestamp(alert.timestamp)}
                          </div>

                          <div className="mt-3 flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleAcknowledge(alert.id);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 
                                       bg-white hover:bg-gray-50 border border-gray-200 rounded 
                                       transition-colors shadow-sm"
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleCreateIncident(alert);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-white 
                                       bg-indigo-600 hover:bg-indigo-700 rounded 
                                       transition-colors shadow-sm"
                            >
                              Create Incident
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <div ref={observerTarget} className="p-4 text-center">
                  {isLoading && (
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent"></div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      {alerts.length > 0 && (
        <div className="px-4 py-2.5 bg-white border-t border-gray-100 flex-shrink-0 sticky bottom-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Active Alerts:</span>
                <span className="text-xs font-semibold text-gray-900">{totalCount}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">Severe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Critical</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-600">Warning</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              onClick={() => navigate('/alerts')}
            >
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}