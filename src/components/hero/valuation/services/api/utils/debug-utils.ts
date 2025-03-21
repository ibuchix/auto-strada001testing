
/**
 * Changes made:
 * - 2025-04-27: Created debugging utilities module extracted from cache-api.ts
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
        error: error
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
    stackTrace: new Error().stack
  });
}
