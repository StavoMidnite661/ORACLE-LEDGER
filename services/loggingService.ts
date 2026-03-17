
import axios from 'axios';
import { SystemLog, NewSystemLog } from '../shared/schema.js';

// Capture original console methods to prevent recursion loop with index.tsx override
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

class LoggingService {
  private static instance: LoggingService;
  private logs: SystemLog[] = [];
  private apiEndpoint = '/api/logs';
  private buffer: NewSystemLog[] = [];
  private flushInterval = 5000; // 5 seconds

  private constructor() {
    this.startFlushing();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  public log(level: 'info' | 'warn' | 'error' | 'debug', source: string, message: any, metadata?: any) {
    const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message);
    const logEntry: NewSystemLog = {
      level,
      source,
      message: formattedMessage,
      metadata: metadata ? JSON.stringify(metadata) : null,
    };

    // Store in buffer for persistence
    this.buffer.push(logEntry);
    
    // Use captured original console to avoid infinite recursion
    const consoleMethod = level === 'debug' ? 'log' : level;
    if (originalConsole[consoleMethod]) {
        (originalConsole as any)[consoleMethod](`[${source.toUpperCase()}]`, message, metadata || '');
    }
  }

  private startFlushing() {
    setInterval(async () => {
      if (this.buffer.length > 0) {
        // Take a chunk of logs, not all of them
        const BATCH_SIZE = 50;
        const logsToFlush = this.buffer.slice(0, BATCH_SIZE);
        
        // Remove them from buffer immediately
        this.buffer = this.buffer.slice(BATCH_SIZE);

        try {
          await axios.post(this.apiEndpoint + '/batch', { logs: logsToFlush }, {
                headers: {
                    'X-User-ID': 'system-logger',
                    'X-User-Email': 'system@sovr.ledger'
                }
            });
        } catch (error) {
          console.warn('Failed to flush logs to server:', error);
          // Restore ONLY if we want to retry, but prevent infinite loops of bad data
          // For now, let's drop bad logs to clear the jam if they are causing 413s
          // this.buffer = [...logsToFlush, ...this.buffer]; 
        }
      }
    }, this.flushInterval);
  }

  public async getHistory(): Promise<SystemLog[]> {
    try {
      const response = await axios.get(this.apiEndpoint, {
        headers: {
          'X-User-ID': 'system-logger',
          'X-User-Email': 'system@sovr.ledger'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch log history:', error);
      return [];
    }
  }
}

export const loggingService = LoggingService.getInstance();
