
/**
 * Centralized logging utility for edge functions
 * Created: 2025-04-19
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Log operations with structured logging
 * @param operation The operation being performed
 * @param details Additional context details
 * @param level Log level
 */
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

/**
 * Create a unique request ID for tracking
 * @returns Unique request identifier
 */
export function createRequestId(): string {
  return crypto.randomUUID();
}
