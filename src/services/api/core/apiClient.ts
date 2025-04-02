
/**
 * Core API client implementation
 * 
 * Changes made:
 * - 2025-11-05: Created as part of apiClientService refactoring
 * - Extracted core functionality from monolithic apiClientService
 */

import { supabase } from "@/integrations/supabase/client";
import { RetryService } from "../../supabase/base/retryService";
import { ApiRequestConfig, ApiResponse } from "../types/apiTypes";
import { makeRequest } from "../utils/requestUtils";
import { normalizeError } from "../utils/errorUtils";
import { DEFAULT_TIMEOUT } from "../constants/timeouts";

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
      const result = await makeRequest(() => 
        this.withRetry<T>(
          () => this.supabase.functions.invoke(functionName, {
            body: data,
            headers: {
              ...(config.headers || {}),
              'X-Request-Timeout': (config.timeout || DEFAULT_TIMEOUT).toString(),
              ...(config.idempotencyKey ? { 'X-Idempotency-Key': config.idempotencyKey } : {})
            }
          }),
          {
            maxRetries: config.retries || 3,
            silent: config.silent,
            errorMessage: config.errorMessage || `Failed to invoke function '${functionName}'`
          }
        ),
        config
      );
      
      return {
        data: result,
        error: null,
        status: 200
      };
    } catch (error: any) {
      return normalizeError<T>(error, config);
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
      const result = await makeRequest(() => 
        this.withRetry<T>(
          async () => {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              ...(config.headers || {})
            };
            
            if (config.idempotencyKey) {
              headers['X-Idempotency-Key'] = config.idempotencyKey;
            }
            
            const response = await fetch(url, {
              method,
              headers,
              body: data ? JSON.stringify(data) : undefined,
              signal: AbortSignal.timeout(config.timeout || DEFAULT_TIMEOUT)
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
        ),
        config
      );
      
      return {
        data: result,
        error: null,
        status: 200
      };
    } catch (error: any) {
      return normalizeError<T>(error, config);
    }
  }
}

// Export a singleton instance for use throughout the app
export const apiClient = new ApiClient();
