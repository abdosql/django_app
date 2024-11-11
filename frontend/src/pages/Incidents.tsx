import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Incident {
  id: number;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'acknowledged' | 'resolved' | 'closed';
  alert_count: number;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const response = await fetch('/api/incidents/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }

        const data = await response.json();
        setIncidents(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        {incidents.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">No Incidents Found</p>
            <p className="text-gray-500">There are no incidents to display at this time.</p>
          </div>
        ) : (
          incidents.map((incident) => (
            <Link
              key={incident.id}
              to={`/incidents/${incident.id}`}
              className="block border-b border-gray-200 last:border-0 hover:bg-gray-50"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className={`h-5 w-5 ${
                      incident.status === 'active' ? 'text-red-500' :
                      incident.status === 'acknowledged' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                    <span className="text-lg font-medium text-gray-900">
                      Incident #{incident.id}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    incident.status === 'active' ? 'bg-red-100 text-red-800' :
                    incident.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                  </span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDistanceToNow(parseISO(incident.start_time), { addSuffix: true })}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
} 