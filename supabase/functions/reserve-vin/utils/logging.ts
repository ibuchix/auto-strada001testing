
/**
 * Logging utilities for reserve-vin
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

/**
 * Create a request ID for tracking operations
 * @returns Unique request ID
 */
export function createRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Log API results
 */
export function logApiResult(
  operation: string,
  requestId: string,
  success: boolean,
  data: any,
  error?: string
): void {
  logOperation(
    `${operation}_result`,
    {
      requestId,
      success,
      hasData: !!data,
      error
    },
    success ? 'info' : 'error'
  );
}
