
/**
 * Logging utilities for setup-profiles-rls
 * Created: 2025-04-19
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

export function logError(
  context: string, 
  error: Error, 
  additionalDetails: Record<string, any> = {}
): void {
  logOperation(context, {
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    ...additionalDetails
  }, 'error');
}

