export interface SystemContext {
  currentTemperature?: number;
  humidity?: number;
  maxTemperature?: number;
  minTemperature?: number;
  trend?: string;
  powerStatus?: string;
  batteryLevel?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export const AVAILABLE_FUNCTIONS = {
  // Reading-related operations
  getLatestReading: {
    name: 'getLatestReading',
    description: 'Get the most recent temperature and humidity reading for a device',
    parameters: {
      type: 'object',
      properties: {
        device_id: {
          type: 'string',
          description: 'ID of the device to get reading for'
        }
      },
      required: ['device_id']
    }
  },
  getReadingsByDateRange: {
    name: 'getReadingsByDateRange',
    description: 'Get temperature and humidity readings within a date range',
    parameters: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in ISO format or relative (e.g., "7_days_ago", "now")'
        },
        end_date: {
          type: 'string',
          description: 'End date in ISO format or relative (e.g., "now")'
        },
        device_id: {
          type: 'string',
          description: 'ID of the device to get readings for'
        }
      },
      required: ['start_date', 'end_date', 'device_id']
    }
  },

  // Device-related operations
  listAllDevices: {
    name: 'listAllDevices',
    description: 'Get a list of all registered IoT devices',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Filter devices by location (e.g., "Lab A", "Lab B")'
        },
        status: {
          type: 'string',
          enum: ['online', 'offline', 'warning', 'error'],
          description: 'Filter devices by their current status'
        }
      }
    }
  },
  getDeviceDetails: {
    name: 'getDeviceDetails',
    description: 'Get detailed information about a specific device',
    parameters: {
      type: 'object',
      properties: {
        device_id: {
          type: 'string',
          description: 'ID of the device'
        }
      },
      required: ['device_id']
    }
  },

  // Alert-related operations
  getActiveAlerts: {
    name: 'getActiveAlerts',
    description: 'Get currently active alerts',
    parameters: {
      type: 'object',
      properties: {
        device_id: {
          type: 'string',
          description: 'Filter alerts by device ID (use "ALL" for all devices)'
        },
        severity: {
          type: 'string',
          enum: ['critical', 'severe', 'warning'],
          description: 'Filter alerts by severity level'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of alerts to return'
        }
      }
    }
  },
  getAlertHistory: {
    name: 'getAlertHistory',
    description: 'Get historical alerts within a date range',
    parameters: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in ISO format or relative (e.g., "7_days_ago")'
        },
        end_date: {
          type: 'string',
          description: 'End date in ISO format or relative (e.g., "now")'
        },
        device_id: {
          type: 'string',
          description: 'Filter alerts by device ID (use "ALL" for all devices)'
        }
      },
      required: ['start_date', 'end_date']
    }
  },

  // Incident-related operations
  getActiveIncidents: {
    name: 'getActiveIncidents',
    description: 'Get currently active temperature anomaly incidents',
    parameters: {
      type: 'object',
      properties: {
        device_id: {
          type: 'string',
          description: 'Filter incidents by device ID'
        }
      }
    }
  },
  getIncidentDetails: {
    name: 'getIncidentDetails',
    description: 'Get detailed information about a specific incident',
    parameters: {
      type: 'object',
      properties: {
        incident_id: {
          type: 'string',
          description: 'ID of the incident'
        }
      },
      required: ['incident_id']
    }
  },

  // Statistics and analytics
  getTemperatureStats: {
    name: 'getTemperatureStats',
    description: 'Get temperature statistics for a device',
    parameters: {
      type: 'object',
      properties: {
        device_id: {
          type: 'string',
          description: 'ID of the device'
        },
        period: {
          type: 'string',
          enum: ['24h', '7d', '30d'],
          description: 'Time period for statistics'
        }
      },
      required: ['device_id', 'period']
    }
  },
  getSystemOverview: {
    name: 'getSystemOverview',
    description: 'Get overall system statistics and health status',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'Filter statistics by location'
        }
      }
    }
  }
}; 