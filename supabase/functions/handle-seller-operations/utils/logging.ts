
/**
 * Logging utilities for handle-seller-operations
 * Created: 2025-04-19
 */

// Log levels for structured logging
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Structured logging utility for edge functions
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
