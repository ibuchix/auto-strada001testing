
/**
 * Shared logging utilities for all edge functions
 */

/**
 * Log an operation with structured data
 * @param operation The operation name
 * @param data The data to log
 * @param level The log level (info, warn, error)
 */
export function logOperation(operation: string, data: Record<string, any>, level: 'info' | 'warn' | 'error' = 'info'): void {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    ...data
  };

  // Use the appropriate console method based on the level
  switch (level) {
    case 'warn':
      console.warn(JSON.stringify(logData));
      break;
    case 'error':
      console.error(JSON.stringify(logData));
      break;
    default:
      console.log(JSON.stringify(logData));
  }
}
