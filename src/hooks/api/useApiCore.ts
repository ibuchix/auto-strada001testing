
/**
 * Core API request hook with shared functionality
 * 
 * Changes made:
 * - 2025-11-05: Created as part of useApiRequest.ts refactoring
 * - Extracted core request functionality into a separate hook
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseApiCoreOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

/**
 * Core hook with shared state and error handling for API requests
 */
export function useApiCore(options: UseApiCoreOptions = {}) {
  const {
    onSuccess,
    onError,
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operation completed successfully'
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  
  /**
   * Handle successful API response
   */
  const handleSuccess = useCallback((responseData: any) => {
    setData(responseData);
    
    if (showSuccessToast) {
      toast.success(successMessage);
    }
    
    if (onSuccess) {
      onSuccess(responseData);
    }
    
    return responseData;
  }, [onSuccess, showSuccessToast, successMessage]);
  
  /**
   * Handle API error
   */
  const handleError = useCallback((err: any) => {
    setError(err);
    
    if (showErrorToast) {
      toast.error(err.message || 'An error occurred');
    }
    
    if (onError) {
      onError(err);
    }
    
    return null;
  }, [onError, showErrorToast]);
  
  /**
   * Execute a request with proper state handling
   */
  const executeRequest = useCallback(async <T,>(
    requestFn: () => Promise<any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await requestFn();
      
      if (response.error) {
        throw response.error;
      }
      
      return handleSuccess(response.data);
    } catch (err: any) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleSuccess, handleError]);
  
  /**
   * Reset the request state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);
  
  return {
    isLoading,
    error,
    data,
    executeRequest,
    reset,
    setData,
    setError,
    setIsLoading
  };
}
