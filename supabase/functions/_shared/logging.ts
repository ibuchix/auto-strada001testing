
/**
 * Shared logging utilities for edge functions
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log an operation with context for easier tracing
 */
export function logOperation(
  operation: string, 
  context: Record<string, any> = {}, 
  level: LogLevel = 'info'
): void {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    operation,
    ...context
  };
  
  // Use appropriate console method based on level
  switch (level) {
    case 'debug':
      console.debug(JSON.stringify(logData));
      break;
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

/**
 * Create a performance tracker to log execution times
 */
export function createPerformanceTracker(requestId: string, operation: string) {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  return {
    checkpoint: (name: string): void => {
      const time = performance.now();
      const durationFromStart = time - startTime;
      checkpoints[name] = durationFromStart;
      
      logOperation(`perf_${operation}_checkpoint`, {
        requestId,
        checkpoint: name,
        durationMs: durationFromStart.toFixed(2)
      }, 'debug');
    },
    
    complete: (status: 'success' | 'failure' | 'error', details: Record<string, any> = {}): void => {
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      logOperation(`perf_${operation}_complete`, {
        requestId,
        status,
        totalDurationMs: totalDuration.toFixed(2),
        checkpoints,
        ...details
      });
    }
  };
}

/**
 * Log an error with standardized format
 */
export function logError(
  operation: string, 
  error: Error | unknown, 
  context: Record<string, any> = {}
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logOperation(`error_${operation}`, {
    errorMessage,
    errorStack,
    ...context
  }, 'error');
}
