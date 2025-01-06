import React from 'react';
import { DeviceRegistration } from '../components/DeviceRegistration';
import { useDevices } from '../hooks/useDevices';

export default function DeviceManagement() {
  const { devices, loading } = useDevices();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Device Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <DeviceRegistration />
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Registered Devices</h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map(device => (
                <div
                  key={device.device_id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{device.name}</h3>
                      <p className="text-sm text-gray-500">{device.location}</p>
                      <p className="text-sm text-gray-500">ID: {device.device_id}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-sm ${
                      device.status === 'online' ? 'bg-green-100 text-green-800' :
                      device.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      device.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {device.status}
                    </div>
                  </div>
                  
                  {device.last_reading && (
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Temperature:</span>
                        <br />
                        {device.last_reading.temperature}°C
                      </div>
                      <div>
                        <span className="text-gray-500">Humidity:</span>
                        <br />
                        {device.last_reading.humidity}%
                      </div>
                      <div>
                        <span className="text-gray-500">Last Update:</span>
                        <br />
                        {new Date(device.last_reading.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
