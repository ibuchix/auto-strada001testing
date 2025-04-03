
/**
 * Changes made:
 * - 2025-05-15: Created debugging utilities module with enhanced logging functionality
 * - 2025-12-22: Added detailed debug, performance tracking, and error logging capabilities
 * - 2025-12-23: Fixed TypeScript errors with spread operator on non-object types
 * - 2025-12-23: Fixed TypeScript errors with property access on dynamic objects
 * - 2026-04-03: Added correlation ID support for end-to-end request tracing
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to get detailed session information for debugging
 */
export async function getSessionDebugInfo(): Promise<any> {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        status: 'error',
        message: error.message,
        error: error,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      status: 'success',
      hasSession: !!sessionData?.session,
      isExpired: sessionData?.session ? new Date(sessionData.session.expires_at * 1000) < new Date() : null,
      userInfo: sessionData?.session?.user ? {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email,
        role: sessionData.session.user.app_metadata?.role || 'unknown'
      } : null,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      status: 'error',
      message: e instanceof Error ? e.message : 'Unknown error getting session',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Log detailed information about an error
 */
export function logDetailedError(error: any, context: string): void {
  console.error(`Error in ${context}:`, error);
  console.error('Error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    stackTrace: new Error().stack,
    timestamp: new Date().toISOString()
  });
}

/**
 * Performance tracking utility for timing operations
 */
export function createPerformanceTracker(operation: string, requestId: string = generateRequestId()) {
  const startTime = performance.now();
  const checkpoints: Record<string, number> = {};
  
  console.log(`[${operation}][${requestId}] Started at ${new Date().toISOString()}`);
  
  return {
    requestId,
    
    checkpoint: (name: string) => {
      const time = performance.now();
      const elapsed = time - startTime;
      checkpoints[name] = elapsed;
      
      console.log(`[${operation}][${requestId}] Checkpoint '${name}': ${elapsed.toFixed(2)}ms`);
      return elapsed;
    },
    
    complete: (status: 'success' | 'failure', details: Record<string, any> = {}) => {
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      console.log(`[${operation}][${requestId}] Completed with status: ${status}`, {
        durationMs: totalDuration.toFixed(2),
        checkpoints: Object.entries(checkpoints).map(([name, time]) => ({
          name,
          timeMs: time.toFixed(2)
        })),
        ...details,
        timestamp: new Date().toISOString()
      });
      
      return totalDuration;
    }
  };
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  // Use crypto.randomUUID when available for better uniqueness
  return typeof crypto !== 'undefined' && crypto.randomUUID ?
    crypto.randomUUID().substring(0, 8) :
    Math.random().toString(36).substring(2, 10);
}

/**
 * Log API call information with performance metrics
 */
export function logApiCall(
  operation: string, 
  params: Record<string, any>, 
  requestId: string = generateRequestId()
): { complete: (result: any, error?: any) => void } {
  const startTime = performance.now();
  const correlationId = typeof crypto !== 'undefined' && crypto.randomUUID ? 
    crypto.randomUUID() : 
    `${requestId}-${Date.now()}`;
  
  console.log(`[API][${operation}][${requestId}] Call started`, {
    ...params,
    correlationId,
    timestamp: new Date().toISOString()
  });
  
  return {
    complete: (result: any, error?: any) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.error(`[API][${operation}][${requestId}] Call failed after ${duration.toFixed(2)}ms`, {
          error: typeof error === 'object' ? error.message : error,
          correlationId,
          params,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`[API][${operation}][${requestId}] Call completed in ${duration.toFixed(2)}ms`, {
          success: true,
          correlationId,
          resultType: typeof result,
          resultSize: JSON.stringify(result).length,
          timestamp: new Date().toISOString()
        });
      }
      
      return { duration, result, error, correlationId };
    }
  };
}
