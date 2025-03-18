
/**
 * Changes made:
 * - 2024-08-20: Created hook for standardized Supabase error handling
 * - 2024-08-25: Refactored to use categorized error handling and improved code organization
 */

import { useState, useCallback } from "react";
import { parseSupabaseError } from "@/utils/validation";
import { toast } from "sonner";
import { 
  ErrorCategory, 
  categorizeError,
  getErrorActions,
  handleCommonError
} from "@/utils/errorHandlers";

interface UseSupabaseErrorHandlingOptions {
  showToast?: boolean;
  toastDuration?: number;
  onError?: (error: any, errorMessage: string, category: ErrorCategory) => void;
  defaultCategory?: ErrorCategory;
}

/**
 * Hook for standardized Supabase error handling with categorization
 */
export const useSupabaseErrorHandling = (options: UseSupabaseErrorHandlingOptions = {}) => {
  const { 
    showToast = true, 
    toastDuration = 5000, 
    onError,
    defaultCategory = ErrorCategory.GENERAL
  } = options;
  
  const [error, setError] = useState<string | null>(null);
  const [errorCategory, setErrorCategory] = useState<ErrorCategory>(defaultCategory);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles Supabase errors with standardized behavior and categorization
   */
  const handleSupabaseError = useCallback((error: any, contextMessage?: string) => {
    const errorMessage = parseSupabaseError(error);
    const fullMessage = contextMessage ? `${contextMessage}: ${errorMessage}` : errorMessage;
    const category = categorizeError(error);
    
    console.error(`[${category}] Supabase error:`, error);
    setError(fullMessage);
    setErrorCategory(category);
    
    if (showToast) {
      const action = getErrorActions(category);
      
      toast.error(fullMessage, {
        duration: toastDuration,
        action: action ? {
          label: action.label,
          onClick: action.onClick
        } : undefined
      });
    }
    
    if (onError) {
      onError(error, fullMessage, category);
    }
    
    return fullMessage;
  }, [showToast, toastDuration, onError]);

  /**
   * Wraps an async function with loading state and error handling
   */
  const withErrorHandling = useCallback(async <T>(
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
  }, [handleSupabaseError]);

  /**
   * Checks if the error is in a specific category
   */
  const isErrorCategory = useCallback((category: ErrorCategory): boolean => {
    return error !== null && errorCategory === category;
  }, [error, errorCategory]);

  return {
    error,
    setError,
    errorCategory,
    isLoading,
    setIsLoading,
    handleSupabaseError,
    withErrorHandling,
    clearError: useCallback(() => setError(null), []),
    isErrorCategory,
    isAuthError: useCallback(() => isErrorCategory(ErrorCategory.AUTHENTICATION), 
      [isErrorCategory]),
    isNetworkError: useCallback(() => isErrorCategory(ErrorCategory.NETWORK), 
      [isErrorCategory]),
    isPermissionError: useCallback(() => isErrorCategory(ErrorCategory.PERMISSION), 
      [isErrorCategory])
  };
};
