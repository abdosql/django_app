import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, Clock, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Incident {
  id: number;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'closed';
  alert_count: number;
  current_escalation_level: number;
  temperature_readings: TemperatureReading[];
  comments: Comment[];
  notifications: IncidentNotification[];
}

interface TemperatureReading {
  temperature: number;
  timestamp: string;
}

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

interface IncidentNotification {
  id: number;
  operator: {
    id: number;
    name: string;
    priority: number;
  };
  status: 'SENT' | 'READ' | 'FAILED';
  sent_at: string;
}

export default function IncidentDetails() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isActionTaken, setIsActionTaken] = useState(false);

  useEffect(() => {
    fetchIncidentDetails();
  }, [id]);

  const fetchIncidentDetails = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`/api/incidents/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch incident details');
      }

      const data = await response.json();
      setIncident(data);
    } catch (error) {
      console.error('Error fetching incident:', error);
      setError(error instanceof Error ? error.message : 'Failed to load incident details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`/api/incidents/${id}/acknowledge/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acknowledgment_note: 'Incident acknowledged by operator'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge incident');
      }

      fetchIncidentDetails();
    } catch (error) {
      console.error('Error acknowledging incident:', error);
      setError(error instanceof Error ? error.message : 'Failed to acknowledge incident');
    }
  };

  const handleAddComment = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`/api/incidents/${id}/comment/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: newComment,
          action_taken: isActionTaken,
          incident_id: id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add comment');
      }

      setNewComment('');
      setIsActionTaken(false);
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

  const comments = incident.comments || [];
  const notifications = incident.notifications || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Incident #{incident.id}
            </h1>
            <div className="mt-2 flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                <Clock className="inline-block h-4 w-4 mr-1" />
                Started {formatDistanceToNow(parseISO(incident.start_time), { addSuffix: true })}
              </span>
            </div>
          </div>
          {incident.status === 'active' && (
            <button
              onClick={handleAcknowledge}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Acknowledge Incident
            </button>
          )}
        </div>
      </div>

      {/* Timeline and Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Comments & Actions</h2>
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  No comments yet
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      {comment.action_taken ? (
                        <AlertCircle className="h-6 w-6 text-indigo-500" />
                      ) : (
                        <MessageSquare className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {getOperatorName(comment)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{comment.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Form */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start space-x-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2">
                    <textarea
                      rows={3}
                      className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center text-sm text-gray-500">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                        checked={isActionTaken}
                        onChange={(e) => setIsActionTaken(e.target.checked)}
                      />
                      Mark as action taken
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Escalation Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Escalation Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Current Level</span>
                <span className="text-sm font-medium text-gray-900">
                  Level {incident.current_escalation_level}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Alert Count</span>
                <span className="text-sm font-medium text-gray-900">
                  {incident.alert_count}
                </span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {notification.operator?.name || 'Unknown Operator'}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        (Priority {notification.operator?.priority || 'N/A'})
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${
                      notification.status === 'READ' ? 'text-green-600' :
                      notification.status === 'SENT' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 