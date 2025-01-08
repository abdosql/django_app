export const API_ENDPOINTS = {
  getLatestReading: '/api/readings/latest/',
  getReadingsByDateRange: '/api/readings/',  // Using the base readings endpoint with query params
  listAllDevices: '/api/devices/',
  getDeviceDetails: '/api/devices/',  // Will append device_id
  getActiveAlerts: '/api/alerts/',  // Will filter with query params
  getAlertHistory: '/api/alerts/',  // Will filter with query params
  getActiveIncidents: '/api/incidents/',  // Will filter with status=open
  getIncidentDetails: '/api/incidents/',  // Will append incident_id
  getTemperatureStats: '/api/temperature/stats/',
  getSystemOverview: '/api/devices/overview/'  // For system-wide status
}; 