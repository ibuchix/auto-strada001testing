
/**
 * Changes made:
 * - 2024-07-22: Extracted logging functionality from utils.ts
 */

/**
 * Log operations with enhanced details
 */
export function logOperation(operation: string, details: Record<string, any>, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    ...details
  };
  
  switch (level) {
    case 'info':
      console.log(`[INFO][${timestamp}] ${operation}:`, JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(`[WARN][${timestamp}] ${operation}:`, JSON.stringify(logData));
      break;
    case 'error':
      console.error(`[ERROR][${timestamp}] ${operation}:`, JSON.stringify(logData));
      break;
  }
}
