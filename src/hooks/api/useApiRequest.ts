
/**
 * Combined API request hook with all HTTP methods
 * 
 * Changes made:
 * - 2025-11-05: Created hook for simplified API interactions
 * - 2025-11-05: Integrated with apiClientService for automatic retries
 * - 2025-11-22: Refactored into smaller files for better maintainability
 * - 2025-11-22: Split functionality into useApiCore and method-specific hooks
 */

import { useCallback } from 'react';
import { 
  useGetRequest, 
  usePostRequest, 
  usePutRequest, 
  useDeleteRequest,
  useInvokeFunctionRequest 
} from './useHttpMethods';
import { UseApiCoreOptions } from './useApiCore';

/**
 * Hook combining all API request methods for easy access
 */
export function useApiRequest(options: UseApiCoreOptions = {}) {
  // Initialize individual hooks
  const getHook = useGetRequest(options);
  const postHook = usePostRequest(options);
  const putHook = usePutRequest(options);
  const deleteHook = useDeleteRequest(options);
  const functionHook = useInvokeFunctionRequest(options);
  
  // Synchronize loading state across hooks
  const isLoading = 
    getHook.isLoading || 
    postHook.isLoading || 
    putHook.isLoading || 
    deleteHook.isLoading ||
    functionHook.isLoading;
  
  // Use first error found
  const error = 
    getHook.error || 
    postHook.error || 
    putHook.error || 
    deleteHook.error ||
    functionHook.error;
  
  // Use most recent data
  const data = 
    functionHook.data || 
    postHook.data || 
    putHook.data || 
    getHook.data || 
    deleteHook.data;
  
  /**
   * Reset all request states
   */
  const reset = useCallback(() => {
    getHook.reset();
    postHook.reset();
    putHook.reset();
    deleteHook.reset();
    functionHook.reset();
  }, [getHook.reset, postHook.reset, putHook.reset, deleteHook.reset, functionHook.reset]);
  
  return {
    // State
    isLoading,
    error,
    data,
    
    // HTTP Methods
    get: getHook.get,
    post: postHook.post,
    put: putHook.put,
    delete: deleteHook.delete,
    
    // Supabase Functions
    invokeFunction: functionHook.invokeFunction,
    
    // Utility methods
    reset
  };
}

// Re-export component types for convenience
export type { UseApiCoreOptions };
