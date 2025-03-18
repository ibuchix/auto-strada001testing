
/**
 * Changes made:
 * - 2024-09-19: Created optimized query hook for better React Query performance
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * A hook for optimized data fetching with React Query
 * Includes automatic error handling, caching, and performance optimizations
 */
export function useOptimizedQuery<TData, TError = Error>(
  queryKey: string | any[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'> & {
    errorMessage?: string;
    showErrorToast?: boolean;
  }
) {
  const {
    errorMessage = "Failed to load data",
    showErrorToast = true,
    ...queryOptions
  } = options || {};

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes default stale time for better performance
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    refetchOnWindowFocus: false, // Disable refetching on window focus for better performance
    retry: 2, // Retry failed requests twice
    ...queryOptions,
    meta: {
      ...queryOptions?.meta,
      onError: (error: any) => {
        console.error(`Query error for ${JSON.stringify(queryKey)}:`, error);
        
        if (showErrorToast) {
          toast.error(errorMessage, {
            description: error?.message || "Please try again later"
          });
        }
        
        // Forward to any user-provided onError
        if (queryOptions?.meta?.onError) {
          queryOptions.meta.onError(error);
        }
      }
    }
  });
}

/**
 * A hook for optimized paginated data fetching
 */
export function useOptimizedPaginatedQuery<TData, TError = Error>(
  queryKey: string | any[],
  queryFn: (page: number, pageSize: number) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'> & {
    page?: number;
    pageSize?: number;
    errorMessage?: string;
    showErrorToast?: boolean;
  }
) {
  const {
    page = 1,
    pageSize = 20,
    ...restOptions
  } = options || {};
  
  // Create a query key that includes pagination parameters
  const paginatedQueryKey = Array.isArray(queryKey) 
    ? [...queryKey, { page, pageSize }] 
    : [queryKey, { page, pageSize }];
  
  return useOptimizedQuery(
    paginatedQueryKey,
    () => queryFn(page, pageSize),
    restOptions
  );
}
