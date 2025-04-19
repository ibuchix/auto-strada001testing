
/**
 * Logging utilities for seller operations
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export function logOperation(
  operation: string, 
  details: Record<string, any> = {},
  level: LogLevel = 'info'
): void {
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
}

export function logError(error: Error, context: Record<string, any> = {}): void {
  logOperation('error', {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
    ...context
  }, 'error');
}

