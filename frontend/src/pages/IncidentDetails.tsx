import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Clock, MessageSquare, CheckCircle, AlertCircle, Thermometer, MapPin, Bell } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { apiService } from '../services/api.service';
import { Incident, TimelineEvent, Notification } from '../types/incident';

interface Comment {
  id: number;
  comment: string;
  action_taken: boolean;
  created_at: string;
  operator: {
    id: number;
    name: string;
  };
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Unknown date';
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const NotificationsList = ({ notifications }: { notifications: Notification[] }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-indigo-500 mr-2" />
          <h3 className="text-lg leading-6 font-medium text-gray-900">Notifications</h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          {notifications.length} Total
        </span>
      </div>
      <div className="border-t border-gray-200">
        {notifications && notifications.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li key={notification.id} className="px-4 py-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        notification.status === 'SENT' ? 'bg-green-400' :
                        notification.status === 'FAILED' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <p className="text-sm font-medium text-gray-900">
                        {notification.operator_name}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDate(notification.sent_at)}
                    </p>
                    <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      notification.status === 'SENT' ? 'bg-green-100 text-green-800' : 
                      notification.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isActionTaken, setIsActionTaken] = useState(false);
  const [isRead, setIsRead] = useState(false);

  useEffect(() => {
    fetchIncidentDetails();
  }, [id]);

  const fetchIncidentDetails = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.getIncidentDetails(parseInt(id));
      if (response.error) {
        throw new Error(response.error);
      }
      setIncident(response.data);
    } catch (error) {
      console.error('Error fetching incident:', error);
      setError(error instanceof Error ? error.message : 'Failed to load incident details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.acknowledgeIncident(parseInt(id), {
        acknowledgment_note: 'Incident acknowledged by operator'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      await fetchIncidentDetails();
    } catch (error) {
      console.error('Error acknowledging incident:', error);
      alert(error instanceof Error ? error.message : 'Failed to acknowledge incident');
    }
  };

  const handleAddComment = async () => {
    if (!id) return;
    
    try {
      const response = await apiService.addIncidentComment(parseInt(id), {
        comment: newComment,
        action_taken: isActionTaken,
        is_read: isRead
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setNewComment('');
      setIsActionTaken(false);
      setIsRead(false);
      await fetchIncidentDetails();
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOperatorName = (comment: Comment) => {
    return comment.operator?.name || 'Unknown Operator';
  };

  const formatTemperature = (description: string) => {
    // Extract temperature value from description using a more precise regex
    const tempMatch = description.match(/temperature:?\s*([-+]?\d*\.?\d+)/i);
    if (tempMatch && tempMatch[1]) {
      const temp = parseFloat(tempMatch[1]);
      return description.replace(tempMatch[1], temp.toFixed(2));
    }
    return description;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'alert_created':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'notification_sent':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'comment_added':
        return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      case 'status_changed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getEventBadges = (event: TimelineEvent) => {
    const badges = [];
    
    if (event.event_type === 'comment_added' && event.metadata) {
      if (event.metadata.action_taken) {
        badges.push(
          <span key="action" className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Action Taken
          </span>
        );
      }
      if (event.metadata.is_read) {
        badges.push(
          <span key="read" className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Read
          </span>
        );
      }
    }
    
    return badges;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Incident</h3>
        <p className="text-gray-500">{error || 'Incident not found'}</p>
      </div>
    );
  }

  const comments = incident?.timeline_events.filter(event => event.event_type === 'comment_added') || [];
  const notifications = incident.notifications || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {incident ? (
        <>
          <div className="mb-6 flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Incident #{incident.id}
                </h2>
                <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  incident.status === 'open' ? 'bg-red-100 text-red-800' :
                  incident.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                  incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {incident.status_display}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Started {formatDate(incident.start_time)}
              </p>
            </div>
            {incident.status === 'open' && (
              <button
                onClick={handleAcknowledge}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!incident.can_acknowledge}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                {incident.can_acknowledge ? 'Acknowledge' : 'Not Authorized to Acknowledge'}
              </button>
            )}
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <Thermometer className="h-4 w-4 mr-1.5 text-gray-400" />
                    Device
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{incident.device_name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{incident.device_location}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1.5 text-gray-400" />
                    Alert Count
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{incident.alert_count}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Escalation Level</dt>
                  <dd className="mt-1 text-sm text-gray-900">Level {incident.current_escalation_level}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatTemperature(incident.description)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <NotificationsList notifications={incident.notifications} />
          
          {/* Timeline Events */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900">Timeline</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {incident.timeline_events.length} Events
              </span>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {incident.timeline_events.map((event, index) => {
                  const eventKey = event.id && event.created_at 
                    ? `${event.id}-${event.created_at}`
                    : `timeline-event-${index}`;
                    
                  return (
                    <li key={eventKey} className="px-4 py-4">
                      <div className="flex space-x-3">
                        <div className="flex-shrink-0">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="text-sm text-gray-900">{formatTemperature(event.description)}</p>
                            {getEventBadges(event)}
                          </div>
                          <div className="mt-1 flex items-center">
                            {event.operator && (
                              <span className="text-sm text-gray-500 mr-2">
                                by {event.operator.name}
                              </span>
                            )}
                            <span className="text-sm text-gray-400">
                              {formatDate(event.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Add Comment Form */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Add Comment
              </h3>
              <div className="space-y-4">
                <div>
                  <textarea
                    rows={3}
                    className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Add your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isActionTaken}
                        onChange={(e) => setIsActionTaken(e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-500">Mark as action taken</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        checked={isRead}
                        onChange={(e) => setIsRead(e.target.checked)}
                      />
                      <span className="ml-2 text-sm text-gray-500">Mark as read</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading incident details...</p>
        </div>
      )}
    </div>
  );
} 