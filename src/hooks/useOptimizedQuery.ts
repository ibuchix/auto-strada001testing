
/**
 * Changes made:
 * - 2024-09-19: Created optimized query hook for better React Query performance
 * - 2024-09-20: Fixed type error with onError meta property
 * - 2024-09-21: Added session validation and handling for RLS
 * - 2024-10-15: Added offline support with local cache fallback
 * - 2024-10-16: Fixed function parameter format for consistent usage
 */

import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { getFromCache, saveToCache } from "@/services/offlineCacheService";

interface OptimizedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'> {
  errorMessage?: string;
  showErrorToast?: boolean;
  requireAuth?: boolean;
  cacheKey?: string; // Key for offline cache
}

/**
 * A hook for optimized data fetching with React Query
 * Includes automatic error handling, caching, performance optimizations,
 * offline support, and respect for Row-Level Security policies
 */
export function useOptimizedQuery<TData, TError = Error>(
  queryKey: string | any[],
  queryFn: () => Promise<TData>,
  options?: OptimizedQueryOptions<TData, TError>
) {
  const { session } = useAuth();
  const { isOffline } = useOfflineStatus({ showToasts: false });
  
  const {
    errorMessage = "Failed to load data",
    showErrorToast = true,
    requireAuth = false,
    cacheKey,
    ...queryOptions
  } = options || {};

  // Check if authentication is required but user is not logged in
  const enabled = !requireAuth || !!session;
  
  // Create a cache key string for local storage
  const cacheKeyString = cacheKey || (Array.isArray(queryKey) ? JSON.stringify(queryKey) : queryKey.toString());

  const result = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      try {
        // Try to get from network first
        const data = await queryFn();
        
        // If successful, cache the data for offline use
        if (cacheKey && data) {
          saveToCache(`query_${cacheKeyString}`, data);
        }
        
        return data;
      } catch (error) {
        // If we're offline, try to get from cache
        if (isOffline && cacheKey) {
          const cachedData = getFromCache<TData>(`query_${cacheKeyString}`);
          if (cachedData) {
            console.log(`Using cached data for query: ${cacheKeyString}`);
            return cachedData;
          }
        }
        
        // If we're not offline or no cache is available, rethrow
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes default stale time for better performance
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
    refetchOnWindowFocus: !isOffline, // Don't refetch on window focus if offline
    retry: isOffline ? 0 : 2, // Don't retry if offline
    enabled: enabled && (!isOffline || (cacheKey && getFromCache(`query_${cacheKeyString}`) !== null)),
    ...queryOptions,
    meta: {
      ...(queryOptions?.meta || {}),
      onError: (error: any) => {
        console.error(`Query error for ${JSON.stringify(queryKey)}:`, error);
        
        if (showErrorToast && !isOffline) {
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
        } else if (isOffline && cacheKey) {
          // If offline and we have a cache key but no data in cache
          const cachedData = getFromCache(`query_${cacheKeyString}`);
          if (!cachedData) {
            toast.warning("You're offline", {
              description: "Some data may not be available until you reconnect",
              duration: 3000
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

  return {
    data: result.data as TData,
    isLoading: result.isLoading,
    error: result.error as TError,
    ...result
  };
}

/**
 * A hook for optimized paginated data fetching that respects RLS and works offline
 */
export function useOptimizedPaginatedQuery<TData, TError = Error>(
  queryKey: string | any[],
  queryFn: (page: number, pageSize: number) => Promise<TData>,
  options?: OptimizedQueryOptions<TData, TError> & {
    page?: number;
    pageSize?: number;
  }
) {
  const {
    page = 1,
    pageSize = 20,
    cacheKey,
    ...restOptions
  } = options || {};
  
  // Create a query key that includes pagination parameters
  const paginatedQueryKey = Array.isArray(queryKey) 
    ? [...queryKey, { page, pageSize }] 
    : [queryKey, { page, pageSize }];
  
  // Create a cache key that includes pagination info
  const paginatedCacheKey = cacheKey ? `${cacheKey}_page${page}_size${pageSize}` : undefined;
  
  return useOptimizedQuery(
    paginatedQueryKey,
    () => queryFn(page, pageSize),
    {
      ...restOptions,
      cacheKey: paginatedCacheKey
    }
  );
}
