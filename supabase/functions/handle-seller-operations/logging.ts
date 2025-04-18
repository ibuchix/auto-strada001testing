
/**
 * Logging utilities for seller operations
 * Updated: 2025-04-18 - Updated to use shared logging module
 * Updated: 2025-04-19 - Inlined logging functions to avoid import issues
 */

// Define the LogLevel type inline to avoid imports
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging utility for seller operations
 * @param operation The operation being performed
 * @param details Optional details to include in the log entry
 * @param level The log level (default: 'info')
 */
export const logOperation = (
  operation: string, 
  details: Record<string, any> = {},
  level: LogLevel = 'info'
): void => {
  // Production environment detection
  const isProduction = Deno.env.get("ENVIRONMENT") === "production";
  
  // In production, only log warnings and errors with minimal details
  if (isProduction && level === 'info') {
    return;
  }
  
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

/**
 * Create a performance tracker for monitoring execution times
 * @param requestId Unique identifier for the request
 * @param operation The operation being tracked
 */
export const createPerformanceTracker = (requestId: string, operation: string) => {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  return {
    checkpoint: (name: string) => {
      checkpoints[name] = performance.now() - startTime;
      logOperation(`${operation}_checkpoint`, {
        requestId,
        checkpoint: name,
        elapsedMs: checkpoints[name].toFixed(2)
      }, 'debug');
    },
    complete: (status: 'success' | 'failure' | 'error', details: Record<string, any> = {}) => {
      const totalTime = performance.now() - startTime;
      logOperation(`${operation}_complete`, {
        requestId,
        status,
        totalTimeMs: totalTime.toFixed(2),
        checkpoints,
        ...details
      });
    }
  };
};
