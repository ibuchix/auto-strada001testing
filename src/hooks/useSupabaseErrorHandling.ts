
/**
 * Changes made:
 * - 2024-08-20: Created hook for standardized Supabase error handling
 */

import { useState } from "react";
import { parseSupabaseError } from "@/utils/validation";
import { toast } from "sonner";

interface UseSupabaseErrorHandlingOptions {
  showToast?: boolean;
  toastDuration?: number;
  onError?: (error: any, errorMessage: string) => void;
}

/**
 * Hook for standardized Supabase error handling
 */
export const useSupabaseErrorHandling = (options: UseSupabaseErrorHandlingOptions = {}) => {
  const { showToast = true, toastDuration = 5000, onError } = options;
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles Supabase errors with standardized behavior
   */
  const handleSupabaseError = (error: any, contextMessage?: string) => {
    const errorMessage = parseSupabaseError(error);
    const fullMessage = contextMessage ? `${contextMessage}: ${errorMessage}` : errorMessage;
    
    console.error('Supabase error:', error);
    setError(fullMessage);
    
    if (showToast) {
      toast.error(fullMessage, {
        duration: toastDuration,
      });
    }
    
    if (onError) {
      onError(error, fullMessage);
    }
    
    return fullMessage;
  };

  /**
   * Wraps an async function with loading state and error handling
   */
  const withErrorHandling = async <T>(
    asyncFn: () => Promise<T>,
    contextMessage?: string
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      return result;
    } catch (error: any) {
      handleSupabaseError(error, contextMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    error,
    setError,
    isLoading,
    setIsLoading,
    handleSupabaseError,
    withErrorHandling,
    clearError: () => setError(null)
  };
};
