
/**
 * Core API request hook with shared functionality
 * 
 * Changes made:
 * - 2025-11-05: Created as part of useApiRequest.ts refactoring
 * - Extracted core request functionality into a separate hook
 * - 2026-05-10: Enhanced error handling with retry mechanism and clearer error messages
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface UseApiCoreOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  retries?: number;
  retryDelay?: number;
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
    successMessage = 'Operation completed successfully',
    retries = 0,
    retryDelay = 1000
  } = options;
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  const retryCountRef = useRef(0);
  
  /**
   * Handle successful API response
   */
  const handleSuccess = useCallback((responseData: any) => {
    setData(responseData);
    // Reset retry count on success
    retryCountRef.current = 0;
    
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
    const isRetryable = 
      err.statusCode === 408 || // Request Timeout
      err.statusCode === 429 || // Too Many Requests
      err.statusCode === 500 || // Internal Server Error
      err.statusCode === 502 || // Bad Gateway
      err.statusCode === 503 || // Service Unavailable
      err.statusCode === 504 || // Gateway Timeout
      err.message?.includes('timeout') ||
      err.message?.includes('network') ||
      err.message?.includes('connection');
      
    // Only set error in state if we're not going to retry
    if (!isRetryable || retryCountRef.current >= retries) {
      setError(err);
      
      // Show error toast with appropriate message
      if (showErrorToast) {
        const errorMessage = err.message || 'An error occurred';
        const errorDescription = isRetryable 
          ? 'Connection issue. Please check your network and try again.' 
          : 'Please try again or contact support if the problem persists.';
          
        toast.error(errorMessage, {
          description: errorDescription
        });
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } else {
      // We will retry, so show a warning toast
      if (showErrorToast) {
        toast.warning('Connection issue, retrying...', {
          description: `Retry attempt ${retryCountRef.current + 1} of ${retries}`,
          duration: retryDelay - 100 // Show just a bit shorter than retry delay
        });
      }
      
      // Don't call onError for retries to avoid duplicate error handling
      return null;
    }
  }, [onError, showErrorToast, retries, retryDelay]);
  
  /**
   * Execute a request with proper state handling and retries
   */
  const executeRequest = useCallback(async <T,>(
    requestFn: () => Promise<any>
  ): Promise<T | null> => {
    // Reset retry count at the start of a new request sequence
    if (!isLoading) {
      retryCountRef.current = 0;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await requestFn();
      
      if (response.error) {
        throw response.error;
      }
      
      return handleSuccess(response.data);
    } catch (err: any) {
      console.error('[API Error]', err);
      
      // Check if we should retry
      const isRetryable = 
        err.statusCode === 408 || // Request Timeout
        err.statusCode === 429 || // Too Many Requests
        err.statusCode === 500 || // Internal Server Error
        err.statusCode === 502 || // Bad Gateway
        err.statusCode === 503 || // Service Unavailable
        err.statusCode === 504 || // Gateway Timeout
        err.message?.includes('timeout') ||
        err.message?.includes('network') ||
        err.message?.includes('connection');
      
      if (isRetryable && retryCountRef.current < retries) {
        // Increment retry count
        retryCountRef.current++;
        
        // Wait for delay and retry
        return new Promise((resolve) => {
          setTimeout(async () => {
            const result = await executeRequest<T>(requestFn);
            resolve(result);
          }, retryDelay * retryCountRef.current); // Progressive backoff
        });
      }
      
      // No more retries, handle the error
      setIsLoading(false);
      return handleError(err);
    } finally {
      // Only set loading to false if we're not retrying
      if (retryCountRef.current >= retries) {
        setIsLoading(false);
      }
    }
  }, [handleSuccess, handleError, retries, retryDelay, isLoading]);
  
  /**
   * Reset the request state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
    retryCountRef.current = 0;
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
