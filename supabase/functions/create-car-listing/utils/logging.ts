
/**
 * Logging utilities for create-car-listing
 * Created: 2025-05-08 - Added to support better diagnostics
 */

/**
 * Log an operation with details
 * 
 * @param operation Operation name
 * @param details Operation details
 * @param level Log level (info, warn, error)
 */
export function logOperation(
  operation: string,
  details: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    ...details
  };
  
  switch (level) {
    case 'warn':
      console.warn(`[create-car-listing] ${operation}:`, logData);
      break;
    case 'error':
      console.error(`[create-car-listing] ${operation}:`, logData);
      break;
    default:
      console.log(`[create-car-listing] ${operation}:`, logData);
  }
}
