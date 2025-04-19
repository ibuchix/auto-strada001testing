
/**
 * Logging utilities for seller operations
 * Updated: 2025-04-19 - Consolidated from shared module to function-specific
 */

// Define log level type
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging utility for seller operations
 */
export const logOperation = (
  operation: string, 
  details: Record<string, any> = {},
  level: LogLevel = 'info'
): void => {
  const isProduction = Deno.env.get("ENVIRONMENT") === "production";
  
  // In production, only log warnings and errors
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
 * Create a performance tracker for monitoring execution times
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
