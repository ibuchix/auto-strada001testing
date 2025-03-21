
/**
 * Changes made:
 * - 2024-10-15: Extracted query optimization functionality from baseService.ts
 */

import { PostgrestBuilder } from "@supabase/postgrest-js";
import { RetryService } from "./retryService";

export class QueryOptimizationService extends RetryService {
  /**
   * Optimize a query by selecting only needed columns
   * @param query The Supabase query builder
   * @param columns The columns to select (defaults to '*')
   * @returns The optimized query
   */
  protected optimizeSelect<T extends PostgrestBuilder<any, any>>(
    query: T,
    columns: string = '*'
  ): T {
    // @ts-ignore - This is safe as select() exists on all query builders
    return query.select(columns);
  }

  /**
   * Apply pagination to a query with optimized count
   * @param query The query to paginate
   * @param page The page number (1-based)
   * @param pageSize The number of items per page
   * @returns Paginated query
   */
  protected paginateQuery<T extends PostgrestBuilder<any, any>>(
    query: T, 
    page: number = 1, 
    pageSize: number = 20
  ): T {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    
    // @ts-ignore - This is safe as range() exists on all filter builders
    return query.range(start, end);
  }

  /**
   * Add caching headers to reduce unnecessary refetches
   * This helps with Supabase's cache-control headers
   */
  protected addCacheControl(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...headers,
      'Cache-Control': 'max-age=60', // Cache for 60 seconds
      'Prefer': 'return=representation'
    };
  }
}
