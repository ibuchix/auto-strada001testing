
/**
 * Changes made:
 * - 2024-09-11: Created base service for all Supabase interactions
 * - 2024-09-16: Added retry and fallback logic for improved resilience
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Maximum retries for any Supabase operation
const DEFAULT_MAX_RETRIES = 3;
// Time to wait between retries (in ms) - will be multiplied by retry attempt for exponential backoff
const DEFAULT_RETRY_DELAY = 1000;

// Base class with common functionality for all services
export class BaseService {
  protected supabase = supabase;
  
  // Utility method to handle database errors consistently
  protected handleError(error: any, customMessage: string = "Operation failed"): never {
    console.error(`Database error:`, error);
    const errorMessage = error?.message || customMessage;
    
    // Display error to user via toast
    toast.error(errorMessage, {
      description: "Please try again or contact support if the problem persists."
    });
    
    throw new Error(errorMessage);
  }
  
  // Utility method to handle database response with error checking
  protected async handleDatabaseResponse<T>(
    operation: () => Promise<{ data: T | null; error: any }>
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        throw error;
      }
      
      if (data === null) {
        throw new Error("No data returned from the database");
      }
      
      return data as T;
    } catch (error: any) {
      this.handleError(error);
    }
  }

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
  
  /**
   * Check if an error is retryable based on its nature
   */
  private isRetryableError(error: any): boolean {
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

// Types for filtering operations
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

export interface Filter {
  column: string;
  operator: FilterOperator;
  value: any;
}

// Types for ordering
export interface Order {
  column: string;
  ascending: boolean;
}

// Common options for query operations
export interface QueryOptions {
  filters?: Filter[];
  order?: Order;
  page?: number;
  pageSize?: number;
  select?: string;
  single?: boolean;
}
