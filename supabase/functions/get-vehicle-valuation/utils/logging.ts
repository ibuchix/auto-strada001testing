
/**
 * Logging utilities for get-vehicle-valuation
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
 * Create a performance tracker for monitoring execution times
 * @param requestId Unique identifier for the request
 * @param operationName Name of the operation being tracked
 */
export function createPerformanceTracker(requestId: string, operationName: string = 'operation') {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  return {
    /**
     * Record a checkpoint with the current time
     * @param name Name of the checkpoint
     * @returns Elapsed time since start in milliseconds
     */
    checkpoint: (name: string): number => {
      const now = performance.now();
      const elapsed = now - startTime;
      checkpoints[name] = elapsed;
      
      // Log the checkpoint
      logOperation('performance_checkpoint', {
        requestId,
        operation: operationName,
        checkpoint: name,
        elapsedMs: elapsed.toFixed(2)
      }, 'debug');
      
      return elapsed;
    },
    
    /**
     * Complete the performance tracking
     * @param status Status of the operation
     * @param details Additional details to include in the log
     */
    complete: (status: 'success' | 'failure' | 'error', details: Record<string, any> = {}): void => {
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      logOperation('performance_complete', {
        requestId,
        operation: operationName,
        status,
        durationMs: totalDuration.toFixed(2),
        checkpoints,
        ...details
      }, status === 'error' ? 'error' : 'info');
    }
  };
}
