
/**
 * Changes made:
 * - 2024-10-15: Extracted error handling functionality from baseService.ts
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export class ErrorHandlingService {
  protected supabase = supabase;
  
  /**
   * Utility method to handle database errors consistently
   * Improved to handle RLS violations
   */
  protected handleError(error: any, customMessage: string = "Operation failed"): never {
    console.error(`Database error:`, error);
    
    // Check if this is an RLS violation or permission error
    if (error?.code === 'PGRST301' || 
        error?.code === '42501' || 
        error?.message?.includes('permission denied') ||
        error?.message?.includes('violates row-level security')) {
      
      toast.error("Access Denied", {
        description: "You don't have permission to perform this action. Please check your access rights."
      });
      
      throw new Error("Permission denied due to Row-Level Security policy");
    }
    
    // Check if this is an authentication error
    if (error?.code === '401' || 
        error?.message?.includes('JWT') || 
        error?.message?.includes('auth')) {
      
      toast.error("Authentication Required", {
        description: "Please sign in to perform this action."
      });
      
      throw new Error("Authentication required");
    }
    
    const errorMessage = error?.message || customMessage;
    
    // Display error to user via toast
    toast.error(errorMessage, {
      description: "Please try again or contact support if the problem persists."
    });
    
    throw new Error(errorMessage);
  }
  
  /**
   * Check if an error is retryable based on its nature
   */
  protected isRetryableError(error: any): boolean {
    // Don't retry client errors (400-level)
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
    
    // Network errors are retryable
    if (error.message?.includes('network') || 
        error.message?.includes('timeout') || 
        error.message?.includes('connection') ||
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // Rate limiting errors are retryable
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return true;
    }
    
    // Server errors are retryable
    if (error.status >= 500) {
      return true;
    }
    
    // By default, don't retry
    return false;
  }
}
