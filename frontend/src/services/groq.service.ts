import axios from 'axios';

interface SystemContext {
  currentTemperature?: number;
  humidity?: number;
  maxTemperature?: number;
  minTemperature?: number;
  trend?: string;
  powerStatus?: string;
  batteryLevel?: number;
}

// Helper functions for data formatting
const formatTemperature = (temp: number): string => {
  if (temp >= 2 && temp <= 8) return `${temp.toFixed(1)}°C ✅`;
  if (temp >= 0 && temp < 2 || temp > 8 && temp <= 10) return `**${temp.toFixed(1)}°C** ⚠️`;
  return `**${temp.toFixed(1)}°C** 🚨`;
};

const getTemperatureStatus = (temp: number): string => {
  if (temp >= 2 && temp <= 8) return 'Normal';
  if (temp >= 0 && temp < 2 || temp > 8 && temp <= 10) return 'Critical';
  return 'Severe';
};

const getTrendEmoji = (trend: string): string => {
  switch (trend?.toLowerCase()) {
    case 'increasing':
    case 'up':
      return '↗️';
    case 'decreasing':
    case 'down':
      return '↘️';
    default:
      return '➡️';
  }
};

const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    hour12: false,
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Simplified table formatting using pure Markdown
const createMarkdownTable = (headers: string[], rows: string[][]): string => {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`);
  
  return `\n${[headerRow, separatorRow, ...dataRows].join('\n')}\n`;
};

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

interface GroqResponse {
  choices: {
    message: {
      role: string;
      content: string;
      function_call?: {
        name: string;
        arguments: string;
      };
    };
  }[];
}

// Available functions that the agent can call
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

// Add new animation steps
const ANIMATION_STEPS = {
  ANALYZING: '🔍 Analyzing request...',
  FETCHING: '📡 Fetching from database...',
  PROCESSING: '⚙️ Processing data...',
  FORMATTING: '📊 Formatting response...',
  COMPLETE: '✨ Complete!'
};

const createSystemPrompt = (context: SystemContext) => {
  let contextInfo = '';
  if (context.currentTemperature !== undefined) {
    const tempStatus = getTemperatureStatus(context.currentTemperature);
    const trendEmoji = getTrendEmoji(context.trend || '');
    const humidity = context.humidity ?? 0;
    const batteryLevel = context.batteryLevel ?? 100;
    
    contextInfo = `
Current System Status:
| Metric | Value | Status |
|--------|--------|--------|
| Temperature | ${formatTemperature(context.currentTemperature)} | ${trendEmoji} |
| Status | ${tempStatus} | ${tempStatus === 'Normal' ? '✅' : tempStatus === 'Critical' ? '⚠️' : '🚨'} |
| Humidity | ${humidity}% | ${humidity >= 30 && humidity <= 70 ? '✅' : '⚠️'} |
| Power | ${context.powerStatus || 'Unknown'} | ${context.powerStatus === 'AC' ? '⚡' : '🔋'} |
| Battery | ${batteryLevel}% | ${batteryLevel > 20 ? '✅' : '⚠️'} |`;
  }

  return `You are a Tricienne Temperature & Humidity Monitoring System Assistant. Follow these strict guidelines:

CORE CAPABILITIES:
1. Temperature & Humidity Monitoring:
   - Get latest readings (getLatestReading)
   - View historical data (getReadingsByDateRange)
   - Check temperature statistics (getTemperatureStats)

2. Device Management:
   - List all devices (listAllDevices)
   - Get device details (getDeviceDetails)
   - View system overview (getSystemOverview)

3. Alert & Incident Handling:
   - Check active alerts (getActiveAlerts)
   - View alert history (getAlertHistory)
   - Monitor incidents (getActiveIncidents, getIncidentDetails)

FUNCTION EXECUTION RULES:
1. When a function needs to be called:
   - First announce: "I'll check that for you..."
   - Call the function and WAIT for its response
   - Only proceed with formatting the response after receiving data
   - If no data is returned, clearly state "No data available"

2. For getLatestReading:
   - Announce: "Fetching the current temperature reading..."
   - Call getLatestReading and wait for response
   - Format response in table if data exists:
     | Time | Temperature | Status | Trend |
     |------|------------|--------|-------|
     | HH:MM | XX.X°C | ✅/⚠️/🚨 | ↗️/↘️/➡️ |

3. For getReadingsByDateRange:
   - Announce: "Retrieving temperature history..."
   - Call function with specified date range
   - Format response in table if data exists
   - Include summary of findings

4. For listAllDevices:
   - Announce: "Getting device list..."
   - Call function and wait for response
   - Format in device status table

RESPONSE RULES:
1. NEVER assume data exists before calling a function
2. ALWAYS wait for function execution to complete
3. NEVER make up or modify returned data
4. If function returns no data, clearly state it
5. Use proper markdown table syntax
6. Include status emojis as defined below

STATUS INDICATORS:
Temperature:
- ✅ Normal (2-8°C)
- ⚠️ Critical (0-2°C or 8-10°C)
- 🚨 Severe (<0°C or >10°C)

Device:
- 🟢 Online
- 🔴 Offline
- ⚡ AC Power
- 🔋 Battery

WHEN ASKED WHAT YOU CAN DO:
Respond with:
"I can help you with:

1. Temperature Monitoring:
   - Get current temperature readings
   - View historical temperature data
   - Check temperature trends and statistics

2. Device Management:
   - List all connected devices
   - Check device status and details
   - Monitor system health

3. Alerts & Incidents:
   - View active temperature alerts
   - Check alert history
   - Monitor and track incidents

Just ask me about any of these topics, and I'll help you get the information you need!"

${contextInfo}

Remember: Always wait for function calls to complete. Never invent or modify data. If data is not available, clearly state it.`;
};

// Add helper function for date calculations
const calculateDate = (dateStr: string): string => {
  if (dateStr === 'now') {
    return new Date().toISOString();
  }
  
  const match = dateStr.match(/(\d+)_days_ago/);
  if (match) {
    const days = parseInt(match[1]);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }
  
  return dateStr;
};

// Enhanced device list formatting with pure Markdown
const formatDeviceList = (devices: any[]): string => {
  if (!devices.length) return '📱 No devices found.';

  const summary = `## 📱 Device Overview
Total Devices: **${devices.length}**
Online: **${devices.filter(d => d.status === 'online').length}** devices
Last Update: ${formatTimestamp(new Date().toISOString())}`;

  const rows = devices.map(device => [
    `**${device.name}**`,
    `${device.status} ${device.status === 'online' ? '🟢' : '🔴'}`,
    `📍 ${device.location}`,
    `${formatTimestamp(device.last_reading || '')}`,
    device.temperature ? `${formatTemperature(device.temperature)}` : 'N/A'
  ]);

  return `${summary}\n${createMarkdownTable(
    ['Device Name', 'Status', 'Location', 'Last Reading', 'Temperature'],
    rows
  )}`;
};

// Enhanced location-specific formatting with pure Markdown
const formatLocationDevices = (devices: any[], location: string): string => {
  const locationDevices = devices.filter(d => 
    d.location?.toLowerCase() === location.toLowerCase()
  );

  if (!locationDevices.length) {
    return `🏢 No devices found in ${location}`;
  }

  const onlineCount = locationDevices.filter(d => d.status === 'online').length;
  const alertCount = locationDevices.filter(d => 
    d.temperature && (d.temperature < 2 || d.temperature > 8)
  ).length;

  const summary = `## 🏢 ${location} Status Report
Devices: **${locationDevices.length}** total
Online: **${onlineCount}** ${onlineCount === locationDevices.length ? '✅' : '⚠️'}
Alerts: **${alertCount}** ${alertCount === 0 ? '✅' : '🚨'}
Last Update: ${formatTimestamp(new Date().toISOString())}`;

  const rows = locationDevices.map(device => [
    `**${device.name}**`,
    `${device.status} ${device.status === 'online' ? '🟢' : '🔴'}`,
    `${formatTimestamp(device.last_reading || '')}`,
    `${device.temperature ? formatTemperature(device.temperature) : 'N/A'}`,
    `${device.humidity ? `${device.humidity}% ${device.humidity >= 30 && device.humidity <= 70 ? '✅' : '⚠️'}` : 'N/A'}`
  ]);

  return `${summary}\n${createMarkdownTable(
    ['Device', 'Status', 'Last Reading', 'Temperature', 'Humidity'],
    rows
  )}`;
};

// Enhanced alert formatting with pure Markdown
const formatAlerts = (alerts: any[]): string => {
  if (!alerts || alerts.length === 0) {
    return '✅ System is operating normally. No active alerts.';
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const severeCount = alerts.filter(a => a.severity === 'severe').length;

  const summary = `## 🚨 Alert Status
Total: **${alerts.length}** active alerts
Critical: **${criticalCount}** ${criticalCount > 0 ? '⚠️' : '✅'}
Severe: **${severeCount}** ${severeCount > 0 ? '🚨' : '✅'}
Last Update: ${formatTimestamp(new Date().toISOString())}`;

  const rows = alerts.map(alert => [
    `${formatTimestamp(alert.timestamp)}`,
    `${alert.severity === 'severe' ? '🚨' : '⚠️'} **${alert.severity.toUpperCase()}**`,
    `${alert.device_name || alert.device_id}`,
    alert.message,
    alert.resolved ? '✅ Resolved' : '⚠️ Active'
  ]);

  return `${summary}\n${createMarkdownTable(
    ['Time', 'Severity', 'Device', 'Message', 'Status'],
    rows
  )}`;
};

// Update API endpoints mapping
const API_ENDPOINTS = {
  getLatestReading: '/api/monitoring/readings/latest/',
  getReadingsByDateRange: '/api/monitoring/readings/',
  listAllDevices: '/api/monitoring/devices/',
  getDeviceDetails: '/api/monitoring/devices/',
  getActiveAlerts: '/api/notifications/alerts/active/',
  getAlertHistory: '/api/notifications/alerts/history/',
  getActiveIncidents: '/api/monitoring/incidents/active/',
  getIncidentDetails: '/api/monitoring/incidents/',
  getTemperatureStats: '/api/monitoring/stats/temperature/',
  getSystemOverview: '/api/monitoring/system/overview/'
};

export const chatService = {
  async sendMessage(
    messages: Message[], 
    context: SystemContext = {},
    handleFunction?: (name: string, args: any) => Promise<any>,
    onStep?: (step: Message) => void
  ): Promise<Message> {
    try {
      // Helper to send animated steps
      const sendAnimatedStep = async (step: string) => {
        onStep?.({
          role: 'system',
          content: `\`\`\`animation\n${step}\n\`\`\``
        });
        await new Promise(resolve => setTimeout(resolve, 800));
      };

      await sendAnimatedStep(ANIMATION_STEPS.ANALYZING);
      
      const systemPrompt = createSystemPrompt(context);
      const fullMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages
      ];

      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          messages: fullMessages,
          functions: Object.values(AVAILABLE_FUNCTIONS),
          function_call: 'auto',
          temperature: 0.7,
          max_tokens: 1000,
          stream: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 6759c386cdc8ad94aa1ab93299f20b30e4e1a0373b53fee98edf36f2a371e85e',
          },
        }
      );

      const responseMessage = response.data.choices[0].message;

      // If the response includes a function call
      if (responseMessage.function_call && handleFunction) {
        await sendAnimatedStep(ANIMATION_STEPS.FETCHING);
        
        const functionName = responseMessage.function_call.name;
        const args = JSON.parse(responseMessage.function_call.arguments);

        console.log(`Executing function ${functionName} with args:`, args);

        try {
        const functionResult = await handleFunction(functionName, args);
          console.log(`Function ${functionName} result:`, functionResult);

          if (!functionResult) {
            return {
              role: 'assistant',
              content: `I tried to get the data but no information is available at the moment. This might mean:
- The device is offline
- No readings have been recorded yet
- There might be a connection issue

Would you like me to try again or check something else?`
            };
          }

          // Format the result based on function type
          let formattedResult = functionResult;
          if (functionName === 'getLatestReading') {
            formattedResult = {
              reading: functionResult,
              formattedTable: createMarkdownTable(
                ['Time', 'Temperature', 'Status', 'Trend'],
                [[
                  formatTimestamp(functionResult.timestamp),
                  formatTemperature(functionResult.temperature),
                  getTemperatureStatus(functionResult.temperature),
                  getTrendEmoji(functionResult.trend)
                ]]
              )
            };
          }

          // Send the formatted result back to the LLM
          const secondResponse = await axios.post(
            'https://api.together.xyz/v1/chat/completions',
            {
              model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
                { role: 'function', name: functionName, content: JSON.stringify(formattedResult) }
              ],
              temperature: 0.7,
              max_tokens: 1000
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 6759c386cdc8ad94aa1ab93299f20b30e4e1a0373b53fee98edf36f2a371e85e',
              },
            }
          );

          return {
            role: 'assistant',
            content: secondResponse.data.choices[0].message.content
          };
        } catch (error: any) {
          console.error('Function execution error:', error);
          return {
            role: 'assistant',
            content: `I encountered an error while trying to get the data: ${error.message}. Would you like me to try again?`
          };
        }
      }

      await sendAnimatedStep(ANIMATION_STEPS.COMPLETE);

      return {
        role: 'assistant',
        content: responseMessage.content
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        role: 'assistant',
        content: 'I encountered an error while processing your request. Please try again.'
      };
    }
  },
  async handleFunction(name: string, args: any): Promise<any> {
    try {
      console.log(`Calling function ${name} with args:`, args);

      switch (name) {
        case 'getLatestReading':
          const device_id = args.device_id || 'ALL';
          const response = await axios.get(`/api/readings/latest/`, {
            params: { device_id }
          });
          
          console.log('Latest reading response:', response.data);
          
          if (!response.data || response.data.error) {
            throw new Error(response.data?.error || 'No data returned from the API');
          }
          
          return {
            timestamp: response.data.timestamp,
            temperature: response.data.temperature,
            humidity: response.data.humidity,
            trend: response.data.trend || 'stable',
            device_id: response.data.device_id,
            power_status: response.data.power_status
          };

        case 'getReadingsByDateRange':
          const start_date = calculateDate(args.start_date);
          const end_date = calculateDate(args.end_date);
          
          response = await axios.get('/api/readings/', {
            params: {
              start_date,
              end_date,
              device_id: args.device_id || 'ALL'
            }
          });
          console.log('Historical readings response:', response.data);
          
          if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Invalid data format returned from the API');
          }
          
          return response.data;

        // ... other cases ...

        default:
          throw new Error(`Unhandled function: ${name}`);
      }
    } catch (error: any) {
      console.error(`Error in ${name}:`, error);
      const errorMessage = error.response?.data?.error || error.message;
      throw new Error(`Failed to execute ${name}: ${errorMessage}`);
    }
  }
}; 