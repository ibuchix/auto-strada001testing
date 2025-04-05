
/**
 * Simplified debugging utilities for API calls
 * Only outputs detailed logs in development environment
 */

// Environment check to disable debugging in production
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Generate a unique request ID for tracing
 */
export const generateRequestId = (): string => {
  return isDevelopment
    ? `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`
    : '';
};

/**
 * Create a performance tracker for timing operations
 * Only logs in development environment
 */
export const createPerformanceTracker = (operation: string, requestId: string) => {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  return {
    checkpoint: (name: string): number => {
      const checkpointTime = performance.now();
      const timeFromStart = checkpointTime - startTime;
      checkpoints[name] = timeFromStart;
      
      // Only log in development
      if (isDevelopment) {
        console.log(`[PERF][${requestId}][${operation}] Checkpoint ${name}: ${timeFromStart.toFixed(2)}ms`);
      }
      
      return timeFromStart;
    },
    complete: (status: 'success' | 'failure', data?: Record<string, any>): void => {
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      if (isDevelopment) {
        console.log(`[PERF][${requestId}][${operation}] Complete (${status}): ${totalTime.toFixed(2)}ms`, 
          data ? JSON.stringify(data) : '');
      }
    }
  };
};
