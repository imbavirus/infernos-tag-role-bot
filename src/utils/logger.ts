import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getLogFileName() {
  const date = new Date();
  return `discord-${date.toISOString().split('T')[0]}.log`;
}

function formatLogMessage(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  return `[${timestamp}] ${level}: ${message}${dataStr}\n`;
}

export const logger = {
  info: (message: string, data?: any) => {
    const logMessage = formatLogMessage('INFO', message, data);
    console.log(message, data || '');
    fs.appendFileSync(path.join(LOG_DIR, getLogFileName()), logMessage);
  },

  error: (message: string, error?: any) => {
    const logMessage = formatLogMessage('ERROR', message, error);
    console.error(message, error || '');
    fs.appendFileSync(path.join(LOG_DIR, getLogFileName()), logMessage);
  },

  debug: (message: string, data?: any) => {
    const logMessage = formatLogMessage('DEBUG', message, data);
    console.debug(message, data || '');
    fs.appendFileSync(path.join(LOG_DIR, getLogFileName()), logMessage);
  }
}; 