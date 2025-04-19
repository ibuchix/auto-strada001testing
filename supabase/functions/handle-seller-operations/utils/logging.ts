
/**
 * Logging utilities for handle-seller-operations
 * Created: 2025-04-19 - Extracted from utils.ts
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

/**
 * Create a request ID for tracking operations
 */
export function createRequestId(): string {
  return crypto.randomUUID();
}
