
/**
 * Logging utilities for create-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Log operation with structured data
 * @param operation Name of the operation being performed
 * @param details Additional details to include in the log
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
 * Create a request ID for tracking operations
 * @returns Unique request ID
 */
export function createRequestId(): string {
  return crypto.randomUUID();
}
