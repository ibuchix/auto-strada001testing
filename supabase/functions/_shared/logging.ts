
/**
 * Shared logging utilities for edge functions
 * Simplified with reduced verbosity for production
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'trace';

interface LogContext {
  timestamp?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Structured logging with level-appropriate details
 */
export function logOperation(
  operation: string, 
  details: Record<string, any>, 
  level: LogLevel = 'info'
): void {
  const timestamp = details.timestamp || new Date().toISOString();
  const requestId = details.requestId || 'no-id';
  
  // Basic structured log data
  const logData = {
    timestamp,
    operation,
    requestId
  };
  
  // Create a concise log message
  const logMessage = `[${level.toUpperCase()}][${requestId}] ${operation}`;
  
  switch (level) {
    case 'info':
      console.log(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    case 'error':
      // For errors, include more details
      console.error(logMessage, JSON.stringify({
        ...logData,
        ...(details.error ? { error: details.error } : {})
      }));
      break;
    case 'debug':
    case 'trace':
      // Only output these in non-production
      if (Deno.env.get("ENVIRONMENT") !== "production") {
        console.log(logMessage, JSON.stringify(details));
      }
      break;
  }
}

/**
 * Shorthand for error logging
 */
export function logError(
  operation: string, 
  details: Record<string, any>
): void {
  logOperation(operation, {
    ...details,
    timestamp: details.timestamp || new Date().toISOString()
  }, 'error');
}

/**
 * Logs request information for debugging (simplified)
 */
export function logRequest(
  requestId: string,
  method: string,
  path: string
): { complete: (status: number) => void } {
  const startTime = performance.now();
  
  logOperation('request_received', {
    requestId,
    method,
    path
  });
  
  return {
    complete: (status: number) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logOperation('response_sent', {
        requestId,
        status,
        duration: duration.toFixed(2) + 'ms'
      });
    }
  };
}
