
/**
 * Changes made:
 * - 2024-09-16: Created hook for resilient Supabase operations with retry logic
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";

// Default values for retry operations
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000;

/**
 * Custom hook for Supabase operations with built-in retry logic
 */
export const useSupabaseOperation = <T, E = Error>(options: {
  onSuccess?: (data: T) => void;
  onError?: (error: E) => void;
  maxRetries?: number;
  retryDelay?: number;
  loadingToast?: boolean;
  successToast?: string;
  errorToast?: string;
} = {}) => {
  const {
    onSuccess,
    onError,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    loadingToast = false,
    successToast,
    errorToast = "Operation failed"
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);
  const [data, setData] = useState<T | null>(null);

  /**
   * Execute a Supabase operation with retry logic
   * @param operationFn The function that performs the Supabase operation
   * @param operationOptions Additional options for this specific operation
   */
  const execute = useCallback(
    async (
      operationFn: () => Promise<T>,
      operationOptions: {
        retryCondition?: (error: any) => boolean;
        fallbackValue?: T | null;
        skipSuccessToast?: boolean;
        skipErrorToast?: boolean;
        loadingMessage?: string;
        successMessage?: string;
        errorMessage?: string;
      } = {}
    ) => {
      const {
        retryCondition = (error) => isRetryableError(error),
        fallbackValue = null,
        skipSuccessToast = false,
        skipErrorToast = false,
        loadingMessage = "Processing...",
        successMessage = successToast,
        errorMessage = errorToast
      } = operationOptions;

      setIsLoading(true);
      setError(null);

      let toastId;
      if (loadingToast) {
        toastId = toast.loading(loadingMessage);
      }

      let lastError: any = null;
      let attempt = 0;

      try {
        while (attempt <= maxRetries) {
          try {
            if (attempt > 0) {
              // Exponential backoff delay
              const backoffTime = retryDelay * Math.pow(2, attempt - 1);
              console.log(`Retry attempt ${attempt}/${maxRetries} after ${backoffTime}ms delay`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
            }

            const result = await operationFn();
            setData(result);

            if (onSuccess) {
              onSuccess(result);
            }

            if (successMessage && !skipSuccessToast) {
              if (toastId) {
                toast.success(successMessage, { id: toastId });
              } else {
                toast.success(successMessage);
              }
            } else if (toastId) {
              toast.dismiss(toastId);
            }

            return result;
          } catch (err: any) {
            lastError = err;
            attempt++;

            if (!retryCondition(err) || attempt > maxRetries) {
              throw err;
            }

            console.warn(`Retry attempt ${attempt}/${maxRetries} due to:`, err.message);
          }
        }

        throw lastError; // Should never reach here but TypeScript wants it
      } catch (err: any) {
        setError(err as E);
        
        if (onError) {
          onError(err as E);
        }

        if (!skipErrorToast) {
          const errorDisplayMessage = err.message || errorMessage;
          
          if (toastId) {
            toast.error(errorDisplayMessage, { id: toastId });
          } else {
            toast.error(errorDisplayMessage);
          }
        } else if (toastId) {
          toast.dismiss(toastId);
        }

        return fallbackValue;
      } finally {
        setIsLoading(false);
      }
    },
    [maxRetries, retryDelay, onSuccess, onError, successToast, errorToast, loadingToast]
  );

  return {
    execute,
    isLoading,
    error,
    data,
    reset: useCallback(() => {
      setData(null);
      setError(null);
    }, [])
  };
};

/**
 * Determines if an error should trigger a retry
 */
function isRetryableError(error: any): boolean {
  // Don't retry client errors (400-level), except rate limiting (429)
  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
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
