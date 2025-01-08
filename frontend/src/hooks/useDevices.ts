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
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getDevices();
      
      if (response.error) {
        throw new Error(response.error);
      }

      const fetchedDevices = response.data || [];
      console.log('Fetched devices:', fetchedDevices);
      setDevices(fetchedDevices);

      // Set the first device as selected if none is selected
      if (!selectedDevice && fetchedDevices.length > 0) {
        console.log('Setting initial device:', fetchedDevices[0].device_id);
        setSelectedDevice(fetchedDevices[0].device_id);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDeviceChange = (deviceId: string) => {
    console.log('Changing selected device to:', deviceId);
    setSelectedDevice(deviceId);
  };

  const registerDevice = async (deviceData: {
    device_id: string;
    name: string;
    location: string;
    reading_interval: number;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.request<Device>('/monitoring/devices/', {
        method: 'POST',
        body: JSON.stringify(deviceData)
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      await fetchDevices(); // Refresh the devices list
      return { success: true };
    } catch (err) {
      console.error('Error registering device:', err);
      setError(err instanceof Error ? err.message : 'Failed to register device');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to register device' };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    devices,
    selectedDevice,
    setSelectedDevice: handleDeviceChange,
    isLoading,
    error,
    refetch: fetchDevices,
    registerDevice
  };
}
