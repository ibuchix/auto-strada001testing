
/**
 * Shared logging utilities for edge functions
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging with enhanced details
 */
export function logOperation(
  operation: string, 
  details: Record<string, any>, 
  level: LogLevel = 'info'
): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    ...details
  };
  
  const logMessage = `[${level.toUpperCase()}][${timestamp}] ${operation}`;
  
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
  logOperation(operation, details, level);
}

/**
 * Logs request information for debugging
 */
export function logRequest(
  requestId: string,
  method: string,
  path: string,
  body?: any
): void {
  logOperation('request_received', {
    requestId,
    method,
    path,
    bodySize: body ? JSON.stringify(body).length : 0,
    timestamp: new Date().toISOString()
  });
}

/**
 * Logs response information for debugging
 */
export function logResponse(
  requestId: string,
  status: number,
  body?: any
): void {
  logOperation('response_sent', {
    requestId,
    status,
    bodySize: body ? JSON.stringify(body).length : 0,
    timestamp: new Date().toISOString()
  });
}
