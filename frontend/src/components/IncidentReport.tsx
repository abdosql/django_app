import React, { useState, useEffect } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { useExport } from '../hooks/useExport';

interface IncidentReportProps {
  incidentId: number;
}

export const IncidentReport: React.FC<IncidentReportProps> = ({ incidentId }) => {
  const { getIncidentDetails, addComment } = useIncidents();
  const { exportIncidentReport, loading: exportLoading } = useExport();
  const [incident, setIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionTaken, setActionTaken] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      const data = await getIncidentDetails(incidentId);
      if (data) {
        setIncident(data);
      }
      setLoading(false);
    };
    fetchIncident();
  }, [incidentId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addComment(incidentId, comment, actionTaken);
    if (result.success) {
      setComment('');
      setActionTaken(false);
      // Refresh incident details
      const data = await getIncidentDetails(incidentId);
      if (data) {
        setIncident(data);
      }
    }
  };

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    await exportIncidentReport(incidentId, format);
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (!incident) {
    return <div className="text-center">Incident not found</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-xl font-semibold">Incident Report #{incident.id}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            disabled={exportLoading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700">Device</h3>
            <p>{incident.device.name} ({incident.device.location})</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Status</h3>
            <p className={`capitalize ${
              incident.status === 'open' ? 'text-red-600' :
              incident.status === 'in_progress' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {incident.status.replace('_', ' ')}
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Start Time</h3>
            <p>{new Date(incident.start_time).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Resolution Time</h3>
            <p>{incident.resolution_time ? new Date(incident.resolution_time).toLocaleString() : 'Not resolved'}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700">Description</h3>
          <p className="mt-1">{incident.description}</p>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700">Alert Details</h3>
          <div className="mt-1 p-3 bg-gray-50 rounded">
            <p><span className="font-medium">Type:</span> {incident.alert.alert_type}</p>
            <p><span className="font-medium">Severity:</span> {incident.alert.severity}</p>
            <p><span className="font-medium">Message:</span> {incident.alert.message}</p>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-700">Timeline</h3>
          <div className="mt-2 space-y-3">
            {incident.comments.map((comment: any) => (
              <div key={comment.id} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <p className="font-medium">{comment.operator.name}</p>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1">{comment.comment}</p>
                {comment.action_taken && (
                  <p className="mt-1 text-sm text-blue-600">Action taken</p>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <form onSubmit={handleAddComment} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Add Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="actionTaken"
              checked={actionTaken}
              onChange={(e) => setActionTaken(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="actionTaken" className="ml-2 block text-sm text-gray-700">
              Action taken
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Comment
          </button>
        </form>
      </div>
    </div>
  );
};
