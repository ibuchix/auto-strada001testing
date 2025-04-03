
/**
 * Shared logging utilities for edge functions
 * Enhanced with structured logging and performance tracking
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'trace';

interface LogContext {
  timestamp?: string;
  duration?: string;
  requestId?: string;
  vin?: string;
  mileage?: number;
  [key: string]: any;
}

/**
 * Structured logging with enhanced details
 */
export function logOperation(
  operation: string, 
  details: Record<string, any>, 
  level: LogLevel = 'info'
): void {
  const timestamp = details.timestamp || new Date().toISOString();
  
  // Ensure requestId is included in the log entry if available
  const requestId = details.requestId || 'no-id';
  
  // Format the log entry with consistent structure
  const logData = {
    timestamp,
    operation,
    requestId,
    ...details
  };
  
  // Create a log message with key information for quick scanning
  const logMessage = `[${level.toUpperCase()}][${timestamp}][${requestId}] ${operation}`;
  
  switch (level) {
    case 'info':
      console.log(logMessage, JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(logMessage, JSON.stringify(logData));
      break;
    case 'error':
      console.error(logMessage, JSON.stringify(logData));
      break;
    case 'debug':
      console.debug(logMessage, JSON.stringify(logData));
      break;
    case 'trace':
      console.log(`[TRACE][${timestamp}][${requestId}] ${operation}`, JSON.stringify(logData));
      break;
  }
}

/**
 * Shorthand for error logging
 */
export function logError(
  operation: string, 
  details: Record<string, any>, 
  level: LogLevel = 'error'
): void {
  logOperation(operation, {
    ...details,
    timestamp: details.timestamp || new Date().toISOString()
  }, level);
}

/**
 * Logs request information for debugging
 */
export function logRequest(
  requestId: string,
  method: string,
  path: string,
  body?: any
): { complete: (status: number, responseSize: number = 0) => void } {
  const startTime = performance.now();
  
  logOperation('request_received', {
    requestId,
    method,
    path,
    bodySize: body ? JSON.stringify(body).length : 0,
    timestamp: new Date().toISOString(),
    headers: 'Available in request object'
  });
  
  return {
    complete: (status: number, responseSize: number = 0) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logOperation('response_sent', {
        requestId,
        status,
        bodySize: responseSize,
        duration: duration.toFixed(2) + 'ms',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Performance tracker utility for timing operations
 */
export function createPerformanceTracker(requestId: string, operation: string) {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  logOperation(`${operation}_started`, {
    requestId,
    startTime: new Date().toISOString()
  });
  
  return {
    checkpoint: (name: string) => {
      const time = performance.now();
      const elapsed = time - startTime;
      checkpoints[name] = elapsed;
      
      logOperation(`${operation}_checkpoint`, {
        requestId,
        checkpoint: name,
        elapsedMs: elapsed.toFixed(2),
        timestamp: new Date().toISOString()
      }, 'debug');
      
      return elapsed;
    },
    
    complete: (result: 'success' | 'failure' = 'success', details: Record<string, any> = {}) => {
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      logOperation(`${operation}_completed`, {
        requestId,
        result,
        durationMs: totalDuration.toFixed(2),
        checkpoints: Object.entries(checkpoints).map(([name, time]) => ({
          name,
          timeMs: time.toFixed(2)
        })),
        ...details,
        timestamp: new Date().toISOString()
      });
      
      return totalDuration;
    }
  };
}
