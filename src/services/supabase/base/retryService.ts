
/**
 * Changes made:
 * - 2024-10-15: Extracted retry functionality from baseService.ts
 */

import { ErrorHandlingService } from "./errorHandlingService";
import { toast } from "sonner";

// Maximum retries for any Supabase operation
const DEFAULT_MAX_RETRIES = 3;
// Time to wait between retries (in ms) - will be multiplied by retry attempt for exponential backoff
const DEFAULT_RETRY_DELAY = 1000;

export class RetryService extends ErrorHandlingService {
  /**
   * Execute a database operation with retry logic
   * @param operation The database operation to execute
   * @param options Optional configuration for retries
   * @returns The result of the operation
   */
  protected async withRetry<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      retryCondition?: (error: any) => boolean;
      fallbackValue?: T;
      errorMessage?: string;
      silent?: boolean;
    } = {}
  ): Promise<T | null> {
    const {
      maxRetries = DEFAULT_MAX_RETRIES,
      retryDelay = DEFAULT_RETRY_DELAY,
      retryCondition = (error) => this.isRetryableError(error),
      fallbackValue = null,
      errorMessage = "Operation failed after multiple attempts",
      silent = false
    } = options;

    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // If not the first attempt, add exponential delay
        if (attempt > 0) {
          const backoffTime = retryDelay * Math.pow(2, attempt - 1);
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${backoffTime}ms delay`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        // Execute the operation and await its result
        const { data, error } = await operation();
        
        // If operation succeeded, return the data
        if (!error) {
          return data;
        }
        
        // If operation failed but the error is retryable
        lastError = error;
        
        // If not retryable or last attempt, throw the error
        if (!retryCondition(error) || attempt === maxRetries) {
          throw error;
        }
        
        console.warn(`Retryable error encountered (attempt ${attempt}/${maxRetries}):`, error.message);
      } catch (error: any) {
        lastError = error;
        
        // If not retryable or last attempt, break the loop
        if (!retryCondition(error) || attempt === maxRetries) {
          break;
        }
      }
    }
    
    // All retries failed, handle based on configuration
    if (!silent) {
      console.error('All retry attempts failed:', lastError);
      toast.error(errorMessage, {
        description: lastError?.message || 'Please try again later or contact support'
      });
    } else {
      console.error('All retry attempts failed (silent mode):', lastError);
    }
    
    // Return fallback value
    return fallbackValue;
  }
}
