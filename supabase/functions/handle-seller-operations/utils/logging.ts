
/**
 * Logging utilities for handle-seller-operations
 * Created: 2025-04-19 - Extracted from utils.ts
 * Updated: 2025-04-21 - Added performance tracking functionality
 */

import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

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
 * Log an error with details
 * @param error The error object
 * @param context Additional context information
 */
export const logError = (error: Error, context: Record<string, any> = {}): void => {
  logOperation('error', {
    errorMessage: error.message,
    errorName: error.name,
    errorStack: error.stack,
    ...context
  }, 'error');
};

/**
 * Create a request ID for tracking operations
 */
export function createRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Create a performance tracker for monitoring execution times
 * @param requestId Unique identifier for the request
 * @param operation The operation being tracked
 */
export const createPerformanceTracker = (requestId: string, operation: string) => {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  return {
    checkpoint: (name: string) => {
      checkpoints[name] = performance.now() - startTime;
      logOperation(`${operation}_checkpoint`, {
        requestId,
        checkpoint: name,
        elapsedMs: checkpoints[name].toFixed(2)
      }, 'debug');
    },
    complete: (status: 'success' | 'failure' | 'error', details: Record<string, any> = {}) => {
      const totalTime = performance.now() - startTime;
      logOperation(`${operation}_complete`, {
        requestId,
        status,
        totalTimeMs: totalTime.toFixed(2),
        checkpoints,
        ...details
      });
    }
  };
};
