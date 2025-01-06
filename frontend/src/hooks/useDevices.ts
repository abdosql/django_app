import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';

interface Device {
  device_id: string;
  name: string;
  location: string;
  reading_interval: number;
  last_reading?: {
    temperature: number;
    humidity: number;
    timestamp: string;
  };
  status: 'online' | 'offline' | 'warning' | 'error';
}

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await apiService.getDevices();
      if (response.error) throw new Error(response.error);
      setDevices(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async (deviceData: Omit<Device, 'status' | 'last_reading'>) => {
    try {
      setLoading(true);
      const response = await apiService.registerDevice(deviceData);
      if (response.error) throw new Error(response.error);
      await fetchDevices(); // Refresh the devices list
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateDeviceStatus = async (deviceId: string) => {
    try {
      const response = await apiService.getDeviceStatus(deviceId);
      if (response.error) throw new Error(response.error);
      setDevices(prev => prev.map(device => 
        device.device_id === deviceId 
          ? { ...device, ...response.data }
          : device
      ));
    } catch (err) {
      console.error(`Error updating device status: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Set up periodic status updates
    const intervalId = setInterval(() => {
      devices.forEach(device => updateDeviceStatus(device.device_id));
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, []);

  return {
    devices,
    loading,
    error,
    registerDevice,
    refreshDevices: fetchDevices,
  };
}
