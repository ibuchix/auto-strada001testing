
/**
 * HTTP method-specific hooks for API requests
 * 
 * Changes made:
 * - 2025-11-05: Created as part of useApiRequest.ts refactoring
 * - Extracted HTTP method implementations into separate hooks
 */

import { useCallback } from 'react';
import { apiClient } from '@/services/api/apiClientService';
import { useApiCore, UseApiCoreOptions } from './useApiCore';

/**
 * Hook for making GET requests
 */
export function useGetRequest(options: UseApiCoreOptions = {}) {
  const { executeRequest, ...state } = useApiCore(options);
  
  const get = useCallback(async <T,>(
    endpoint: string,
    config = {}
  ) => {
    return executeRequest<T>(() => apiClient.get<T>(endpoint, config));
  }, [executeRequest]);
  
  return { ...state, get };
}

/**
 * Hook for making POST requests
 */
export function usePostRequest(options: UseApiCoreOptions = {}) {
  const { executeRequest, ...state } = useApiCore(options);
  
  const post = useCallback(async <T,>(
    endpoint: string,
    data: any,
    config = {}
  ) => {
    return executeRequest<T>(() => apiClient.post<T>(endpoint, data, config));
  }, [executeRequest]);
  
  return { ...state, post };
}

/**
 * Hook for making PUT requests
 */
export function usePutRequest(options: UseApiCoreOptions = {}) {
  const { executeRequest, ...state } = useApiCore(options);
  
  const put = useCallback(async <T,>(
    endpoint: string,
    data: any,
    config = {}
  ) => {
    return executeRequest<T>(() => apiClient.put<T>(endpoint, data, config));
  }, [executeRequest]);
  
  return { ...state, put };
}

/**
 * Hook for making DELETE requests
 */
export function useDeleteRequest(options: UseApiCoreOptions = {}) {
  const { executeRequest, ...state } = useApiCore(options);
  
  const remove = useCallback(async <T,>(
    endpoint: string,
    config = {}
  ) => {
    return executeRequest<T>(() => apiClient.delete<T>(endpoint, config));
  }, [executeRequest]);
  
  return { ...state, delete: remove };
}

/**
 * Hook for invoking Supabase Functions
 */
export function useInvokeFunctionRequest(options: UseApiCoreOptions = {}) {
  const { executeRequest, ...state } = useApiCore(options);
  
  const invokeFunction = useCallback(async <T,>(
    functionName: string,
    functionData: any,
    config = {}
  ) => {
    return executeRequest<T>(() => apiClient.invokeFunction<T>(functionName, functionData, config));
  }, [executeRequest]);
  
  return { ...state, invokeFunction };
}
