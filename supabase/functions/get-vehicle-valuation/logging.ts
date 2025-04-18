
/**
 * Logging utilities for vehicle valuation
 * Updated: 2025-04-18 - Now using shared logging module
 * Updated: 2025-04-19 - Inlined logging functions to avoid import issues
 */

// Define the LogLevel type inline to avoid imports
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging utility for vehicle valuation
 * @param operation The operation being performed
 * @param details Optional details to include in the log entry
 * @param level The log level (default: 'info')
 */
export const logOperation = (
  operation: string, 
  details: Record<string, any> = {},
  level: LogLevel = 'info'
): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
};

/**
 * Log an error with details
 * @param error The error object
 * @param context Additional context information
 */
export const logError = (error: Error, context: Record<string, any> = {}): void => {
  logOperation('error', {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
    ...context
  }, 'error');
};

/**
 * Log an API request
 * @param method HTTP method
 * @param path Request path
 * @param details Additional request details
 */
export const logRequest = (
  method: string,
  path: string,
  details: Record<string, any> = {}
): void => {
  logOperation('request', {
    method,
    path,
    ...details
  });
};

/**
 * Log an API response
 * @param status HTTP status code
 * @param details Additional response details
 */
export const logResponse = (
  status: number,
  details: Record<string, any> = {}
): void => {
  logOperation('response', {
    status,
    ...details
  });
};
