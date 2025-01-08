import axios, { AxiosError } from 'axios';
import { AVAILABLE_FUNCTIONS, SystemContext, Message } from './types';
import { formatTemperature, getTemperatureStatus, getTrendEmoji, formatTimestamp, createMarkdownTable, formatDeviceList, formatLocationDevices, formatAlerts, calculateDate } from './formatters';
import { API_ENDPOINTS } from './constants';

export type { Message };
export { AVAILABLE_FUNCTIONS };

const TOGETHER_API_KEY = import.meta.env.VITE_TOGETHER_API_KEY;
const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';

interface StepCallback {
  (step: {
    type: string;
    message: string;
    details?: string;
  }): void;
}

interface StepHistory {
  steps: {
    type: string;
    message: string;
    details?: string;
    timestamp: string;
  }[];
}

interface AgentStep {
  type: 'agent_start' | 'agent_thinking' | 'function_planning' | 'function_call' | 'database_request' | 'database_response' | 'processing_data' | 'generating_response' | 'agent_complete' | 'error';
  message: string;
  details?: string;
  timestamp?: string;
}

const createSystemPrompt = (context: SystemContext) => {
  let contextInfo = '';
  if (context.currentTemperature !== undefined) {
    const tempStatus = getTemperatureStatus(context.currentTemperature);
    const trendEmoji = getTrendEmoji(context.trend || '');
    const humidity = context.humidity ?? 0;
    const batteryLevel = context.batteryLevel ?? 100;
    
    contextInfo += `\nCurrent System Status:
- Temperature: ${formatTemperature(context.currentTemperature)} ${trendEmoji}
- Status: **${tempStatus}**
- Humidity: ${humidity}% ${humidity >= 30 && humidity <= 70 ? '✅' : '⚠️'}
- Temperature Trend: ${context.trend || 'stable'} ${trendEmoji}
- Max Temperature: ${formatTemperature(context.maxTemperature ?? context.currentTemperature)}
- Min Temperature: ${formatTemperature(context.minTemperature ?? context.currentTemperature)}
- Power Status: ${context.powerStatus || 'Unknown'} ${context.powerStatus === 'AC' ? '⚡' : '🔋'}
- Battery Level: ${batteryLevel}% ${batteryLevel > 20 ? '✅' : '⚠️'}`;
  }

  return `You are an IoT Temperature & Humidity Monitoring System Assistant. Your role is to help users monitor and analyze temperature data.

When users ask about temperature trends:
1. Use getReadingsByDateRange for the last 24 hours by default
2. If no specific device is mentioned, use "ALL" as device_id
3. Present the data with clear trend analysis
4. Highlight any concerning patterns
5. Include both temperature and humidity trends when available

For general temperature queries:
- "current temperature" → use getLatestReading
- "temperature history" → use getReadingsByDateRange
- "temperature trends" → use getReadingsByDateRange with trend analysis
- "alerts" → use getActiveAlerts
- "system status" → use getSystemOverview

${contextInfo}

Remember to:
1. Always specify the time range in your response
2. Highlight any anomalies or concerning patterns
3. Provide context for the temperature values
4. Use clear, concise language
5. Format responses using markdown for readability
6. Present data in tables when appropriate
7. Use emojis to indicate status (✅ normal, ⚠️ warning, 🚨 critical)`;
};

export const chatService = {
  stepHistory: [] as StepHistory['steps'],

  addStep(step: Omit<StepHistory['steps'][0], 'timestamp'>) {
    const stepWithTimestamp = {
      ...step,
      timestamp: new Date().toISOString()
    };
    this.stepHistory.push(stepWithTimestamp);
    return stepWithTimestamp;
  },

  getStepHistory() {
    return this.stepHistory;
  },

  clearStepHistory() {
    this.stepHistory = [];
  },

  async sendMessage(
    messages: Message[], 
    context: SystemContext = {},
    handleFunction?: (name: string, args: any) => Promise<any>,
    onStep?: (step: AgentStep) => void
  ): Promise<Message> {
    try {
      // Start agent execution
      onStep?.({
        type: 'agent_start',
        message: 'Starting request analysis',
        details: 'Initializing agent and loading context'
      });

      const systemPrompt = createSystemPrompt(context);
      const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          name: msg.name,
          function_call: msg.function_call
        }))
      ];

      // Agent thinking about the request
      onStep?.({
        type: 'agent_thinking',
        message: 'Analyzing user request',
        details: 'Determining required actions and planning execution steps'
      });

      const response = await axios.post(
        TOGETHER_API_URL,
        {
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: fullMessages,
          functions: Object.values(AVAILABLE_FUNCTIONS),
          function_call: 'auto',
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOGETHER_API_KEY}`,
          },
        }
      );

      // Check if response is HTML (error case)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        console.error('Received HTML response instead of JSON:', response.data);
        throw new Error('Invalid API response format');
      }

      if (!response.data?.choices?.[0]?.message) {
        console.error('Invalid response from Together API:', response.data);
        throw new Error('Invalid response from Together API');
      }

      const responseMessage = response.data.choices[0].message;

      // If the agent decides to call a function
      if (responseMessage.function_call && handleFunction) {
        onStep?.({
          type: 'function_planning',
          message: 'Planning function execution',
          details: `Selected function: ${responseMessage.function_call.name}\nPreparing arguments and validation`
        });

        try {
          const functionName = responseMessage.function_call.name;
          const args = JSON.parse(responseMessage.function_call.arguments);

          onStep?.({
            type: 'function_call',
            message: `Executing function: ${functionName}`,
            details: `Arguments: ${JSON.stringify(args, null, 2)}`
          });

          onStep?.({
            type: 'database_request',
            message: 'Requesting data from database',
            details: `Endpoint: ${functionName}\nParameters: ${JSON.stringify(args, null, 2)}`
          });

          // Execute the function and get the result
          const functionResult = await handleFunction(functionName, args);

          onStep?.({
            type: 'database_response',
            message: 'Received data from database',
            details: `Raw data: ${JSON.stringify(functionResult, null, 2)}`
          });

          onStep?.({
            type: 'processing_data',
            message: 'Processing and formatting data',
            details: 'Applying data transformations and formatting rules'
          });

          // Format the function result
          let formattedResult = functionResult;
          
          // Format specific types of data
          if (functionName === 'listAllDevices' && Array.isArray(functionResult)) {
            if (args.location) {
              formattedResult = {
                devices: functionResult,
                formattedTable: formatLocationDevices(functionResult, args.location)
              };
            } else {
              formattedResult = {
                devices: functionResult,
                formattedTable: formatDeviceList(functionResult)
              };
            }
          } else if (functionName === 'getReadingsByDateRange' && Array.isArray(functionResult.readings)) {
            const rows = functionResult.readings.map((reading: any) => [
              formatTimestamp(reading.timestamp),
              formatTemperature(reading.temperature),
              `${reading.humidity}%`,
              reading.device_id || 'ALL',
              getTemperatureStatus(reading.temperature),
              getTrendEmoji(reading.trend || '')
            ]);
            
            formattedResult = {
              ...functionResult,
              formattedTable: createMarkdownTable(
                ['Time', 'Temperature', 'Humidity', 'Device', 'Status', 'Trend'],
                rows
              )
            };
          } else if (functionName === 'getActiveAlerts' && Array.isArray(functionResult)) {
            formattedResult = {
              alerts: functionResult,
              formattedTable: formatAlerts(functionResult)
            };
          }

          onStep?.({
            type: 'generating_response',
            message: 'Generating final response',
            details: 'Combining processed data with natural language explanation'
          });

          // Recursively call sendMessage with the function result
          return this.sendMessage(
            [...messages, 
             { ...responseMessage, role: 'assistant' }, 
             {
               role: 'function',
               name: functionName,
               content: JSON.stringify(formattedResult)
             }
            ],
            context,
            handleFunction,
            onStep
          );
        } catch (error) {
          onStep?.({
            type: 'error',
            message: 'Error during function execution',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      }

      onStep?.({
        type: 'agent_complete',
        message: 'Request completed successfully',
        details: 'All steps executed successfully'
      });

      return {
        role: 'assistant',
        content: responseMessage.content || 'I apologize, but I was unable to generate a proper response.'
      };
    } catch (error) {
      onStep?.({
        type: 'error',
        message: 'Error in agent execution',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async handleFunction(name: string, args: any): Promise<any> {
    try {
      const endpoint = API_ENDPOINTS[name as keyof typeof API_ENDPOINTS];
      if (!endpoint) {
        throw new Error(`Unknown function: ${name}`);
      }

      // Process date parameters if they exist
      const processedArgs = { ...args };
      if (processedArgs.start_date) {
        processedArgs.start_date = calculateDate(processedArgs.start_date);
      }
      if (processedArgs.end_date) {
        processedArgs.end_date = calculateDate(processedArgs.end_date);
      }

      let response;
      console.log('Calling function:', name, 'with args:', processedArgs);

      switch (name) {
        case 'getReadingsByDateRange':
          response = await axios.get('/api/readings/', {
            params: {
              device_id: processedArgs.device_id || 'ALL',
              start_date: processedArgs.start_date,
              end_date: processedArgs.end_date
            }
          });
          
          // Transform the response to include trend information
          if (response.data && Array.isArray(response.data)) {
            const readings = response.data.map((reading: any, index: number, array: any[]) => {
              let trend = 'stable';
              if (index > 0) {
                trend = reading.temperature > array[index - 1].temperature ? 'up' : 
                       reading.temperature < array[index - 1].temperature ? 'down' : 'stable';
              }
              return { ...reading, trend };
            });
            
            return {
              readings,
              summary: {
                total: readings.length,
                maxTemp: Math.max(...readings.map((r: any) => r.temperature)),
                minTemp: Math.min(...readings.map((r: any) => r.temperature)),
                avgTemp: readings.reduce((acc: number, r: any) => acc + r.temperature, 0) / readings.length
              }
            };
          }
          break;

        case 'getLatestReading':
          response = await axios.get('/api/readings/latest/', {
            params: {
              device_id: processedArgs.device_id || 'ALL'
            }
          });
          break;

        case 'listAllDevices':
          response = await axios.get('/api/devices/', {
            params: processedArgs.location ? { location: processedArgs.location } : undefined
          });
          break;

        case 'getDeviceDetails':
          response = await axios.get(`/api/devices/${processedArgs.device_id}/`);
          break;

        case 'getActiveAlerts':
          response = await axios.get('/api/alerts/', {
            params: {
              device_id: processedArgs.device_id !== "ALL" ? processedArgs.device_id : undefined,
              status: 'active',
              severity: processedArgs.severity,
              limit: processedArgs.limit || 10
            }
          });
          break;

        case 'getAlertHistory':
          response = await axios.get('/api/alerts/history/', {
            params: {
              device_id: processedArgs.device_id !== "ALL" ? processedArgs.device_id : undefined,
              start_date: processedArgs.start_date,
              end_date: processedArgs.end_date
            }
          });
          break;

        case 'getActiveIncidents':
          response = await axios.get('/api/incidents/', {
            params: {
              device_id: processedArgs.device_id,
              status: 'open,acknowledged,investigating'
            }
          });
          break;

        case 'getIncidentDetails':
          response = await axios.get(`/api/incidents/${processedArgs.incident_id}/`);
          break;

        case 'getTemperatureStats':
          response = await axios.get('/api/temperature/stats/', {
            params: {
              device_id: processedArgs.device_id,
              period: processedArgs.period
            }
          });
          break;

        case 'getSystemOverview':
          response = await axios.get('/api/system/overview/');
          break;

        default:
          throw new Error(`Unhandled function: ${name}`);
      }

      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error handling function ${name}:`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error handling function ${name}`);
    }
  }
}; 