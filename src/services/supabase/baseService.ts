
/**
 * Changes made:
 * - 2024-09-11: Implemented base service for all Supabase interactions
 * - 2024-09-16: Added retry and fallback logic for improved resilience
 * - 2024-09-17: Fixed TypeScript type issues with PostgrestBuilder
 * - 2024-09-18: Updated withRetry method to use Promise<{ data: T | null; error: any }> type
 * - 2024-09-19: Added query optimization utilities for better performance
 * - 2024-09-21: Enhanced error handling for Row-Level Security (RLS) violations
 * - 2024-10-15: Refactored into smaller modules for better maintainability
 */

import { supabase } from "@/integrations/supabase/client";
import { ResponseHandlingService } from "./base/responseHandlingService";

// Base class with common functionality for all services
export class BaseService extends ResponseHandlingService {
  protected supabase = supabase;
}

// Types for filtering operations
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

export interface Filter {
  column: string;
  operator: FilterOperator;
  value: any;
}

// Types for ordering
export interface Order {
  column: string;
  ascending: boolean;
}

// Common options for query operations
export interface QueryOptions {
  filters?: Filter[];
  order?: Order;
  page?: number;
  pageSize?: number;
  select?: string;
  single?: boolean;
}
