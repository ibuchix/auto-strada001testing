
/**
 * Changes made:
 * - 2024-09-19: Created optimized query hook for better React Query performance
 * - 2024-09-20: Fixed type error with onError meta property
 * - 2024-09-21: Added session validation and handling for RLS
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

/**
 * A hook for optimized data fetching with React Query
 * Includes automatic error handling, caching, performance optimizations,
 * and respect for Row-Level Security policies
 */
export function useOptimizedQuery<TData, TError = Error>(
  queryKey: string | any[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'> & {
    errorMessage?: string;
    showErrorToast?: boolean;
    requireAuth?: boolean;
  }
) {
  const { session } = useAuth();
  const {
    errorMessage = "Failed to load data",
    showErrorToast = true,
    requireAuth = false,
    ...queryOptions
  } = options || {};

  // Check if authentication is required but user is not logged in
  const enabled = !requireAuth || !!session;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes default stale time for better performance
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    refetchOnWindowFocus: false, // Disable refetching on window focus for better performance
    retry: 2, // Retry failed requests twice
    enabled,
    ...queryOptions,
    meta: {
      ...(queryOptions?.meta || {}),
      onError: (error: any) => {
        console.error(`Query error for ${JSON.stringify(queryKey)}:`, error);
        
        if (showErrorToast) {
          // Check if error is related to authentication/authorization
          if (error?.code === '401' || error?.code === 'PGRST301' || 
              error?.message?.includes('JWT') || error?.message?.includes('auth')) {
            toast.error("Authentication Required", {
              description: "Please sign in to access this data"
            });
          } else {
            toast.error(errorMessage, {
              description: error?.message || "Please try again later"
            });
          }
        }
        
        // Forward to any user-provided onError if it exists
        if (queryOptions?.meta?.onError && typeof queryOptions.meta.onError === 'function') {
          queryOptions.meta.onError(error);
        }
      }
    }
  });
}

/**
 * A hook for optimized paginated data fetching that respects RLS
 */
export function useOptimizedPaginatedQuery<TData, TError = Error>(
  queryKey: string | any[],
  queryFn: (page: number, pageSize: number) => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'> & {
    page?: number;
    pageSize?: number;
    errorMessage?: string;
    showErrorToast?: boolean;
    requireAuth?: boolean;
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
