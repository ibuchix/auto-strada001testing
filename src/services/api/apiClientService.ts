
/**
 * API Client Service
 * 
 * Changes made:
 * - 2025-11-05: Created robust API client with automatic retries and error normalization
 * - Implemented configurable retry strategy with exponential backoff
 * - Added standardized error handling and response normalization
 * - Integrated with existing error types for consistent application behavior
 */

import { supabase } from "@/integrations/supabase/client";
import { RetryService } from "../supabase/base/retryService";
import { toast } from "sonner";
import { 
  createNetworkError, 
  createTimeoutError,
  createSubmissionError,
  handleAppError
} from "@/errors/factory";
import { SubmissionErrorCode } from "@/errors/types";

// Default timeout in milliseconds
const DEFAULT_TIMEOUT = 15000;

interface ApiRequestConfig {
  retries?: number;
  timeout?: number;
  silent?: boolean;
  errorMessage?: string;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: number;
}

/**
 * Core API client service with automatic retries and error normalization
 */
export class ApiClient extends RetryService {
  
  /**
   * Make a GET request to the API
   */
  async get<T>(
    endpoint: string, 
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, null, config);
  }
  
  /**
   * Make a POST request to the API
   */
  async post<T>(
    endpoint: string, 
    data: any,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, config);
  }
  
  /**
   * Make a PUT request to the API
   */
  async put<T>(
    endpoint: string, 
    data: any,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config);
  }
  
  /**
   * Make a DELETE request to the API
   */
  async delete<T>(
    endpoint: string, 
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, null, config);
  }
  
  /**
   * Make a request to a Supabase Edge Function
   */
  async invokeFunction<T>(
    functionName: string,
    data: any,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { timeout = DEFAULT_TIMEOUT } = config;
      
      // Create a promise that will reject after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(createTimeoutError('Request timed out', { timeout }));
        }, timeout);
      });
      
      // Create the actual request promise
      const requestPromise = this.withRetry<T>(
        async () => {
          return await this.supabase.functions.invoke(functionName, {
            body: data,
            headers: {
              ...(config.headers || {}),
              'X-Request-Timeout': timeout.toString()
            }
          });
        },
        {
          maxRetries: config.retries || 3,
          silent: config.silent,
          errorMessage: config.errorMessage || `Failed to invoke function '${functionName}'`
        }
      );
      
      // Race the request against the timeout
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      return {
        data: result,
        error: null,
        status: 200
      };
    } catch (error: any) {
      return this.normalizeError<T>(error, config);
    }
  }
  
  /**
   * Make a request to an external API
   */
  private async request<T>(
    method: string,
    url: string,
    data: any = null,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { timeout = DEFAULT_TIMEOUT } = config;
      
      // Create a promise that will reject after the timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(createTimeoutError('Request timed out', { timeout }));
        }, timeout);
      });
      
      // Create the actual request promise
      const requestPromise = this.withRetry<T>(
        async () => {
          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(config.headers || {})
            },
            body: data ? JSON.stringify(data) : undefined,
            signal: AbortSignal.timeout(timeout)
          });
          
          const responseData = await response.json();
          
          if (!response.ok) {
            throw new Error(responseData.message || `Request failed with status ${response.status}`);
          }
          
          return { data: responseData, error: null };
        },
        {
          maxRetries: config.retries || 3,
          silent: config.silent,
          errorMessage: config.errorMessage || `Failed to ${method} ${url}`
        }
      );
      
      // Race the request against the timeout
      const result = await Promise.race([requestPromise, timeoutPromise]);
      
      return {
        data: result,
        error: null,
        status: 200
      };
    } catch (error: any) {
      return this.normalizeError<T>(error, config);
    }
  }
  
  /**
   * Normalize errors into a consistent format
   */
  private normalizeError<T>(error: any, config: ApiRequestConfig): ApiResponse<T> {
    console.error('API request error:', error);
    
    // Don't show toast for silent requests
    if (!config.silent) {
      try {
        handleAppError(error);
      } catch (e) {
        // Fallback error handling if our standard handler fails
        toast.error(error.message || 'An error occurred');
      }
    }
    
    // Detect error type
    let status = 500;
    
    if (error.status) {
      status = error.status;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      status = 408; // Request Timeout
    } else if (error.message?.includes('network') || error.message?.includes('connection')) {
      status = 0; // Network Error
    } else if (error.code === 'UNAUTHORIZED' || error.message?.includes('unauthorized')) {
      status = 401;
    } else if (error.code === 'FORBIDDEN' || error.message?.includes('forbidden')) {
      status = 403;
    } else if (error.code === 'NOT_FOUND' || error.message?.includes('not found')) {
      status = 404;
    }
    
    return {
      data: null,
      error,
      status
    };
  }
}

// Export a singleton instance for use throughout the app
export const apiClient = new ApiClient();
