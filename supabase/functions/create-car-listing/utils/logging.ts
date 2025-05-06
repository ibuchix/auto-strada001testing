
/**
 * Logging utilities for create-car-listing
 * Created: 2025-05-06 - Moved from external dependency to local implementation
 */

/**
 * Log an operation with structured data
 * 
 * @param operation Operation name/type
 * @param data Operation data
 * @param level Log level (default: 'info')
 */
export function logOperation(
  operation: string,
  data: Record<string, any> = {},
  level: 'info' | 'error' | 'warn' | 'debug' = 'info'
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...data
  };
  
  console.log(JSON.stringify(logData));
}

/**
 * Create a unique request ID for tracking
 * @returns Unique request ID
 */
export function createRequestId(): string {
  return crypto.randomUUID();
}
