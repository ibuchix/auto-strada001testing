
/**
 * Shared logging utilities for edge functions
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

/**
 * Create a performance tracker for timing operations
 */
export function createPerformanceTracker(requestId: string, operation: string) {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  return {
    checkpoint: (name: string): number => {
      const checkpointTime = performance.now();
      const timeFromStart = checkpointTime - startTime;
      checkpoints[name] = timeFromStart;
      
      // Only log in non-production
      if (!isProduction) {
        console.log(`[PERF][${requestId}][${operation}] Checkpoint ${name}: ${timeFromStart.toFixed(2)}ms`);
      }
      
      return timeFromStart;
    },
    complete: (status: 'success' | 'failure' | 'error', data?: Record<string, any>): void => {
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      if (!isProduction || status !== 'success') {
        console.log(`[PERF][${requestId}][${operation}] Complete (${status}): ${totalTime.toFixed(2)}ms`, 
          data ? JSON.stringify(data) : '');
      }
    }
  };
}

/**
 * Log errors while preserving stack traces
 */
export function logError(context: string, error: Error): void {
  console.error(`[ERROR] ${context}:`, error.message);
  if (error.stack) {
    console.error(error.stack);
  }
}
