
/**
 * Changes made:
 * - 2025-04-06: Simplified logging utilities with minimal necessary functionality
 * - 2025-04-06: Removed excessive debug logs while keeping essential error tracking
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to get basic session information for debugging
 */
export async function getSessionDebugInfo(): Promise<any> {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      status: 'success',
      hasSession: !!sessionData?.session,
      isExpired: sessionData?.session ? new Date(sessionData.session.expires_at * 1000) < new Date() : null,
      userInfo: sessionData?.session?.user ? {
        id: sessionData.session.user.id,
        email: sessionData.session.user.email
      } : null
    };
  } catch (e) {
    return {
      status: 'error',
      message: e instanceof Error ? e.message : 'Unknown error getting session'
    };
  }
}

/**
 * Log detailed information about an error (simplified)
 */
export function logDetailedError(error: any, context: string): void {
  if (process.env.NODE_ENV === 'production') {
    // In production, log minimal details
    console.error(`Error in ${context}:`, error.message || error);
    return;
  }
  
  // In development, log more details
  console.error(`Error in ${context}:`, error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stackTrace: new Error().stack
  });
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ?
    crypto.randomUUID().substring(0, 8) :
    Math.random().toString(36).substring(2, 10);
}

/**
 * Log API call information with minimal details in production
 */
export function logApiCall(
  operation: string, 
  params: Record<string, any>,
  requestId: string = generateRequestId()
): { complete: (result: any, error?: any) => void } {
  const startTime = performance.now();
  
  // Simplified logging in production
  if (process.env.NODE_ENV === 'production') {
    console.log(`[API][${operation}][${requestId}] Call started`);
    
    return {
      complete: (result: any, error?: any) => {
        const duration = performance.now() - startTime;
        
        if (error) {
          console.error(`[API][${operation}][${requestId}] Call failed after ${duration.toFixed(2)}ms`, {
            error: typeof error === 'object' ? error.message : error
          });
        } else {
          console.log(`[API][${operation}][${requestId}] Call completed in ${duration.toFixed(2)}ms`);
        }
        
        return { duration, result, error };
      }
    };
  }
  
  // More detailed logging in development
  console.log(`[API][${operation}][${requestId}] Call started`, {
    ...params,
    timestamp: new Date().toISOString()
  });
  
  return {
    complete: (result: any, error?: any) => {
      const duration = performance.now() - startTime;
      
      if (error) {
        console.error(`[API][${operation}][${requestId}] Call failed after ${duration.toFixed(2)}ms`, {
          error: typeof error === 'object' ? error.message : error,
          params
        });
      } else {
        console.log(`[API][${operation}][${requestId}] Call completed in ${duration.toFixed(2)}ms`, {
          success: true,
          resultType: typeof result,
          resultSize: JSON.stringify(result).length
        });
      }
      
      return { duration, result, error };
    }
  };
}
