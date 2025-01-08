import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Search, Database, Bot, Loader2, Check, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatService, Message, AVAILABLE_FUNCTIONS } from '../services/groq.service';
import axios from 'axios';
import classNames from 'classnames';
import remarkGfm from 'remark-gfm';

interface ChatbotButtonProps {
  currentTemperature?: number;
  humidity?: number;
  maxTemperature?: number;
  minTemperature?: number;
  trend?: string;
  powerStatus?: string;
  batteryLevel?: number;
  deviceId?: string;
}

const calculateDate = (dateStr: string): string => {
  if (dateStr === 'now') {
    return new Date().toISOString();
  }
  
  const match = dateStr.match(/(\d+)_days_ago/);
  if (match) {
    const daysAgo = parseInt(match[1]);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  }
  
  return dateStr;
};

interface ProcessingStep {
  type: 'thinking' | 'fetching' | 'processing' | 'complete';
  message: string;
}

// Add animation steps
const STEPS = [
  { icon: '🔍', message: 'Analyzing request...', animation: 'animate-bounce' },
  { icon: '📡', message: 'Fetching from database...', animation: 'animate-pulse' },
  { icon: '⚙️', message: 'Processing data...', animation: 'animate-spin' },
  { icon: '📊', message: 'Formatting response...', animation: 'animate-pulse' },
];

// Add suggestions
const SUGGESTIONS = [
  {
    text: "Show current temperature",
    icon: "🌡️",
    description: "Get the latest temperature readings"
  },
  {
    text: "Show all devices",
    icon: "📱",
    description: "List all connected IoT devices"
  },
  {
    text: "Check alerts",
    icon: "🚨",
    description: "View active temperature alerts"
  },
  {
    text: "Temperature history",
    icon: "📊",
    description: "View temperature trends over time"
  }
];

export default function ChatbotButton({
  currentTemperature,
  humidity,
  maxTemperature,
  minTemperature,
  trend,
  powerStatus,
  batteryLevel,
  deviceId,
}: ChatbotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, processingSteps]);

  const handleFunctionCall = async (name: string, args: any): Promise<any> => {
    // Add step for starting the function call
    setMessages(prev => [...prev, {
      role: 'system',
      content: `\`\`\`step\n🔄 Starting function: ${name}\n\`\`\``
    }]);

    const API_ENDPOINTS = {
      getLatestReading: '/api/readings/latest/',
      getReadingsByDateRange: '/api/readings/',
      listAllDevices: '/api/devices/',
      getDeviceDetails: '/api/devices/details/',
      getActiveAlerts: '/api/alerts/active/',
      getAlertHistory: '/api/alerts/history/',
      getActiveIncidents: '/api/incidents/active/',
      getIncidentDetails: '/api/incidents/details/',
      getTemperatureStats: '/api/readings/stats/',
      getSystemOverview: '/api/system/overview/'
    };

    const endpoint = API_ENDPOINTS[name as keyof typeof API_ENDPOINTS];
    if (!endpoint) {
      throw new Error(`Unknown function: ${name}`);
    }

    // Show API endpoint being called
    setMessages(prev => [...prev, {
      role: 'system',
      content: `\`\`\`step\n🌐 Calling API: ${endpoint}\n\`\`\``
    }]);

    try {
      let response;
      
      switch (name) {
        case 'getLatestReading':
          setMessages(prev => [...prev, {
            role: 'system',
            content: `\`\`\`step\n📡 Fetching latest reading for device: ${args.device_id || 'ALL'}\n\`\`\``
          }]);
          response = await axios.get(`${endpoint}${args.device_id}/`);
          break;

        case 'getReadingsByDateRange':
          // Process date parameters
          const start_date = calculateDate(args.start_date);
          const end_date = calculateDate(args.end_date);
          
          setMessages(prev => [...prev, {
            role: 'system',
            content: `\`\`\`step\n📊 Fetching readings from ${start_date} to ${end_date}\n\`\`\``
          }]);
          
          response = await axios.get(endpoint, { 
            params: {
              start_date,
              end_date,
              device_id: args.device_id || 'ALL'
            }
          });

          // Log the response for debugging
          console.log('Readings response:', response.data);
          break;

        case 'listAllDevices':
          setMessages(prev => [...prev, {
            role: 'system',
            content: `\`\`\`step\n📱 Listing all devices${args.location ? ` in ${args.location}` : ''}\n\`\`\``
          }]);
          response = await axios.get(endpoint, {
            params: args.location ? { location: args.location } : undefined
          });
          break;

        default:
          throw new Error(`Unhandled function: ${name}`);
      }

      // Show success message
      setMessages(prev => [...prev, {
        role: 'system',
        content: `\`\`\`step\n✅ Data retrieved successfully\n\`\`\``
      }]);

      return response.data;
    } catch (error: any) {
      // Show detailed error message
      const errorMessage = error.response?.data?.message || error.message;
      setMessages(prev => [...prev, {
        role: 'system',
        content: `\`\`\`step\n❌ Error: ${errorMessage}\n\`\`\``
      }]);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Add animation steps one by one
    for (const step of STEPS) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `\`\`\`step\n${step.icon} ${step.message}\n\`\`\``
      }]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const response = await chatService.sendMessage(
        [...messages, userMessage],
        {
          currentTemperature,
          humidity,
          maxTemperature,
          minTemperature,
          trend,
          powerStatus,
          batteryLevel,
        },
        handleFunctionCall
      );

      // Add final response
      setMessages(prev => [...prev, response]);
      setIsLoading(false);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '**Error**: I encountered an issue while processing your request. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  // Add a component to render processing steps with animation
  const ProcessingSteps: React.FC<{ steps: ProcessingStep[] }> = ({ steps }) => {
    return (
      <div className="flex flex-col gap-2 p-2 text-sm text-gray-600">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-2 animate-fadeIn"
            style={{
              animation: 'fadeIn 0.3s ease-in-out',
              animationFillMode: 'forwards',
              opacity: 0
            }}
          >
            {step.type === 'thinking' && <Bot className="w-4 h-4 animate-bounce" />}
            {step.type === 'fetching' && <Database className="w-4 h-4 animate-pulse" />}
            {step.type === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{step.message}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 shadow-lg transition-all duration-200"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[500px] bg-white rounded-lg shadow-2xl border-0 animate-slideUp">
          <div className="flex flex-col h-[550px]">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-100 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Tricienne Assistant</h3>
                  <p className="text-xs text-gray-500">Real-time system monitoring</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center space-y-3">
                  <div className="p-3 bg-white rounded-xl shadow-sm border-0">
                    <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 mb-1.5">Welcome to Tricienne Assistant 👋</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      I can help you monitor your IoT devices, track temperature changes, and manage system alerts.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {SUGGESTIONS.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setInputMessage(suggestion.text);
                            handleSendMessage();
                          }}
                          className="flex items-center gap-2 p-2 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                        >
                          <span className="text-xl group-hover:scale-110 transition-transform">
                            {suggestion.icon}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{suggestion.text}</div>
                            <div className="text-xs text-gray-500">{suggestion.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'system'
                        ? 'bg-white text-gray-600 font-mono text-xs shadow-sm'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    {message.role === 'system' && message.content.includes('```step') ? (
                      <div className="flex items-center gap-2">
                        <div className={classNames(
                          'w-5 h-5 flex items-center justify-center',
                          message.content.includes('Analyzing') && 'animate-bounce',
                          message.content.includes('Fetching') && 'animate-pulse',
                          message.content.includes('Processing') && 'animate-spin',
                          message.content.includes('Formatting') && 'animate-pulse'
                        )}>
                          {message.content.includes('Analyzing') && '🔍'}
                          {message.content.includes('Fetching') && '📡'}
                          {message.content.includes('Processing') && '⚙️'}
                          {message.content.includes('Formatting') && '📊'}
                        </div>
                        <span className="text-xs text-gray-600">{message.content.replace(/```step\n|\n```/g, '')}</span>
                      </div>
                    ) : (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        className="prose prose-xs max-w-none"
                        components={{
                          table: ({node, ...props}) => (
                            <div className="my-2 overflow-x-auto rounded-lg border border-gray-100">
                              <table className="min-w-full divide-y divide-gray-100" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => (
                            <thead className="bg-gray-50" {...props} />
                          ),
                          tr: ({node, isHeader, ...props}) => (
                            <tr className="even:bg-gray-50" {...props} />
                          ),
                          th: ({node, ...props}) => (
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-100" {...props} />
                          ),
                          td: ({node, ...props}) => (
                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900 border-b border-gray-50" {...props} />
                          ),
                          code: ({node, inline, ...props}) => (
                            inline ? 
                              <code className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-900 rounded" {...props} /> :
                              <code className="block p-3 text-xs bg-gray-900 text-white rounded-lg overflow-x-auto" {...props} />
                          ),
                          p: ({node, ...props}) => (
                            <p className="text-sm text-gray-900 mb-1.5" {...props} />
                          ),
                          strong: ({node, ...props}) => (
                            <strong className="font-semibold text-gray-900" {...props} />
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about temperature, devices, or alerts..."
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 