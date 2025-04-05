
/**
 * Changes made:
 * - 2025-04-06: Simplified logging with minimal output in production
 */

// Production environment detection
const isProduction = Deno.env.get("ENVIRONMENT") === "production";

/**
 * Log operations with severity-based details
 */
export function logOperation(operation: string, details: Record<string, any>, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  
  // In production, only log warnings and errors with minimal details
  if (isProduction && level === 'info') {
    return;
  }
  
  // Simplified log data for production
  const logData = isProduction ? 
    { operation, ...details } : 
    { timestamp, operation, ...details };
  
  switch (level) {
    case 'info':
      console.log(`[INFO] ${operation}`);
      break;
    case 'warn':
      console.warn(`[WARN] ${operation}`, JSON.stringify(logData));
      break;
    case 'error':
      console.error(`[ERROR] ${operation}`, JSON.stringify(logData));
      break;
  }
}
