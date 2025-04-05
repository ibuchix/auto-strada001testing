
/**
 * Updated debugging utilities for API calls
 * Added more robust utility functions for production/development differentiation
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

/**
 * Log API calls with performance tracking
 * Only detailed in development environment
 */
export const logApiCall = (name: string, params: Record<string, any>, requestId: string) => {
  const startTime = performance.now();
  
  // Only log detailed info in development
  if (isDevelopment) {
    console.log(`[API][${requestId}][${name}] Started`, params);
  }
  
  return {
    complete: (result: any = null, error: any = null) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (isDevelopment) {
        if (error) {
          console.error(`[API][${requestId}][${name}] Failed after ${duration.toFixed(2)}ms:`, error);
        } else {
          console.log(`[API][${requestId}][${name}] Completed in ${duration.toFixed(2)}ms`);
        }
      }
      
      return result || error;
    }
  };
};

/**
 * Log detailed error information
 * Only logs full details in development
 */
export const logDetailedError = (message: string, error: any): void => {
  if (!isDevelopment) {
    // In production, log minimal info
    console.error(`Error: ${message}`);
    return;
  }
  
  console.error(`[ERROR] ${message}:`, error);
  if (error && error.stack) {
    console.error(error.stack);
  }
};

/**
 * Get session debug information for troubleshooting
 * Returns minimal info in production
 */
export const getSessionDebugInfo = async (): Promise<Record<string, any>> => {
  if (!isDevelopment) {
    return { environment: 'production' };
  }
  
  try {
    const sessionInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      environment: process.env.NODE_ENV,
      hasLocalStorage: typeof localStorage !== 'undefined',
      hasSessionStorage: typeof sessionStorage !== 'undefined',
      connectionType: (navigator as any).connection ? (navigator as any).connection.effectiveType : 'unknown'
    };
    
    return sessionInfo;
  } catch (error) {
    console.error('Error getting session debug info:', error);
    return { error: 'Failed to get session info' };
  }
};
