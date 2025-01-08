// Helper functions for data formatting
export const formatTemperature = (temp: number): string => {
  if (temp >= 2 && temp <= 8) return `${temp.toFixed(2)}°C ✅`;
  if (temp >= 0 && temp < 2 || temp > 8 && temp <= 10) return `**${temp.toFixed(2)}°C** ⚠️`;
  return `**${temp.toFixed(2)}°C** 🚨`;
};

export const getTemperatureStatus = (temp: number): string => {
  if (temp >= 2 && temp <= 8) return 'Normal';
  if (temp >= 0 && temp < 2 || temp > 8 && temp <= 10) return 'Critical';
  return 'Severe';
};

export const getTrendEmoji = (trend: string): string => {
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

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const createMarkdownTable = (headers: string[], rows: string[][]): string => {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separatorRow = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`);
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
};

export const formatDeviceList = (devices: any[]): string => {
  if (!devices.length) return 'No devices found.';

  const rows = devices.map(device => [
    device.name,
    `${device.status} ${device.status === 'online' ? '🟢' : '🔴'}`,
    device.location,
    formatTimestamp(device.last_reading || ''),
    device.temperature ? formatTemperature(device.temperature) : 'N/A'
  ]);

  return createMarkdownTable(
    ['Device Name', 'Status', 'Location', 'Last Reading', 'Temperature'],
    rows
  );
};

export const formatLocationDevices = (devices: any[], location: string): string => {
  const locationDevices = devices.filter(d => 
    d.location?.toLowerCase() === location.toLowerCase()
  );

  if (!locationDevices.length) {
    return `No devices found in ${location} 📍`;
  }

  const onlineCount = locationDevices.filter(d => d.status === 'online').length;
  const alertCount = locationDevices.filter(d => 
    d.temperature && (d.temperature < 2 || d.temperature > 8)
  ).length;

  const summary = `
### 📍 ${location} Summary
- Total Devices: **${locationDevices.length}**
- Online: **${onlineCount}** ${onlineCount === locationDevices.length ? '✅' : '⚠️'}
- Alerts: **${alertCount}** ${alertCount === 0 ? '✅' : '🚨'}
`;

  const rows = locationDevices.map(device => [
    device.name,
    `${device.status} ${device.status === 'online' ? '🟢' : '🔴'}`,
    formatTimestamp(device.last_reading || ''),
    device.temperature ? formatTemperature(device.temperature) : 'N/A',
    device.humidity ? `${device.humidity}% ${device.humidity >= 30 && device.humidity <= 70 ? '✅' : '⚠️'}` : 'N/A'
  ]);

  const table = createMarkdownTable(
    ['Device Name', 'Status', 'Last Reading', 'Temperature', 'Humidity'],
    rows
  );

  return summary + '\n' + table;
};

export const formatAlerts = (alerts: any[]): string => {
  if (!alerts || alerts.length === 0) {
    return '✅ No recent alerts found.';
  }

  const summary = `
### Recent Alerts Summary
- Total Alerts: **${alerts.length}**
- Critical: **${alerts.filter(a => a.severity === 'critical').length}** ⚠️
- Severe: **${alerts.filter(a => a.severity === 'severe').length}** 🚨
`;

  const rows = alerts.map(alert => [
    formatTimestamp(alert.timestamp),
    `${alert.severity === 'severe' ? '🚨' : '⚠️'} **${alert.severity.toUpperCase()}**`,
    alert.device_name || alert.device_id,
    alert.message,
    alert.resolved ? '✅ Resolved' : '⚠️ Active'
  ]);

  const table = createMarkdownTable(
    ['Time', 'Severity', 'Device', 'Message', 'Status'],
    rows
  );

  return summary + '\n' + table;
};

export const calculateDate = (dateStr: string): string => {
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