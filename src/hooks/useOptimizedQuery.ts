
/**
 * Changes made:
 * - 2024-09-19: Created optimized query hook for better React Query performance
 * - 2024-09-20: Fixed type error with onError meta property
 * - 2024-09-21: Added session validation and handling for RLS
 * - 2024-09-24: Fixed parameter handling to support object parameter pattern
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

// Type for the object parameter pattern
export interface OptimizedQueryParams<TData, TError = Error> {
  queryKey: string | any[];
  queryFn: () => Promise<TData>;
  enabled?: boolean;
  requireAuth?: boolean;
  errorMessage?: string;
  showErrorToast?: boolean;
  meta?: Record<string, any>;
  [key: string]: any; // Allow other UseQueryOptions properties
}

/**
 * A hook for optimized data fetching with React Query
 * Includes automatic error handling, caching, performance optimizations,
 * and respect for Row-Level Security policies
 */
export function useOptimizedQuery<TData, TError = Error>(
  params: OptimizedQueryParams<TData, TError>
) {
  const { session } = useAuth();
  const {
    queryKey,
    queryFn,
    errorMessage = "Failed to load data",
    showErrorToast = true,
    requireAuth = false,
    meta = {},
    ...queryOptions
  } = params;

  // Check if authentication is required but user is not logged in
  const enabled = queryOptions.enabled !== false && (!requireAuth || !!session);

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
      ...(meta || {}),
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
        if (meta?.onError && typeof meta.onError === 'function') {
          meta.onError(error);
        }
      }
    }
  });
}

/**
 * A hook for optimized paginated data fetching that respects RLS
 */
export function useOptimizedPaginatedQuery<TData, TError = Error>(
  params: OptimizedQueryParams<TData, TError> & {
    page?: number;
    pageSize?: number;
  }
) {
  const {
    queryKey,
    queryFn,
    page = 1,
    pageSize = 20,
    ...restOptions
  } = params;
  
  // Create a paginated query function that takes page and pageSize
  const paginatedQueryFn = () => {
    if (typeof queryFn === 'function') {
      return queryFn();
    }
    return Promise.reject(new Error("Invalid query function"));
  };
  
  // Create a query key that includes pagination parameters
  const paginatedQueryKey = Array.isArray(queryKey) 
    ? [...queryKey, { page, pageSize }] 
    : [queryKey, { page, pageSize }];
  
  return useOptimizedQuery({
    ...restOptions,
    queryKey: paginatedQueryKey,
    queryFn: paginatedQueryFn,
  });
}
