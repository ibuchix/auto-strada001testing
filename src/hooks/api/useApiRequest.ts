
/**
 * Hook for making API requests with automatic loading state and error handling
 * 
 * Changes made:
 * - 2025-11-05: Created new hook for simplified API interactions
 * - Integrated with apiClientService for automatic retries
 * - Added loading, success, and error states
 * - Implemented proper error handling with toast notifications
 */

import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api/apiClientService';
import { toast } from 'sonner';

interface UseApiRequestOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApiRequest(options: UseApiRequestOptions = {}) {
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
   * Execute a GET request
   */
  const get = useCallback(async <T,>(
    endpoint: string,
    config = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get<T>(endpoint, config);
      
      if (response.error) {
        throw response.error;
      }
      
      setData(response.data);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err);
      
      if (showErrorToast) {
        toast.error(err.message || 'An error occurred');
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage]);
  
  /**
   * Execute a POST request
   */
  const post = useCallback(async <T,>(
    endpoint: string,
    data: any,
    config = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<T>(endpoint, data, config);
      
      if (response.error) {
        throw response.error;
      }
      
      setData(response.data);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err);
      
      if (showErrorToast) {
        toast.error(err.message || 'An error occurred');
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage]);
  
  /**
   * Execute a PUT request
   */
  const put = useCallback(async <T,>(
    endpoint: string,
    data: any,
    config = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.put<T>(endpoint, data, config);
      
      if (response.error) {
        throw response.error;
      }
      
      setData(response.data);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err);
      
      if (showErrorToast) {
        toast.error(err.message || 'An error occurred');
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage]);
  
  /**
   * Execute a DELETE request
   */
  const remove = useCallback(async <T,>(
    endpoint: string,
    config = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.delete<T>(endpoint, config);
      
      if (response.error) {
        throw response.error;
      }
      
      setData(response.data);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err);
      
      if (showErrorToast) {
        toast.error(err.message || 'An error occurred');
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage]);
  
  /**
   * Execute a Supabase Function with proper error handling
   */
  const invokeFunction = useCallback(async <T,>(
    functionName: string,
    functionData: any,
    config = {}
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.invokeFunction<T>(functionName, functionData, config);
      
      if (response.error) {
        throw response.error;
      }
      
      setData(response.data);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return response.data;
    } catch (err: any) {
      setError(err);
      
      if (showErrorToast) {
        toast.error(err.message || 'An error occurred');
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, showSuccessToast, showErrorToast, successMessage]);
  
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
    get,
    post,
    put,
    delete: remove,
    invokeFunction,
    reset
  };
}
