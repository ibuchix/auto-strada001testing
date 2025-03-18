
/**
 * Changes made:
 * - 2024-09-11: Created base service for all Supabase interactions
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Base class with common functionality for all services
export class BaseService {
  protected supabase = supabase;
  
  // Utility method to handle database errors consistently
  protected handleError(error: any, customMessage: string = "Operation failed"): never {
    console.error(`Database error:`, error);
    const errorMessage = error?.message || customMessage;
    
    // Display error to user via toast
    toast.error(errorMessage, {
      description: "Please try again or contact support if the problem persists."
    });
    
    throw new Error(errorMessage);
  }
  
  // Utility method to handle database response with error checking
  protected async handleDatabaseResponse<T>(
    operation: () => Promise<{ data: T | null; error: any }>
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        throw error;
      }
      
      if (data === null) {
        throw new Error("No data returned from the database");
      }
      
      return data as T;
    } catch (error: any) {
      this.handleError(error);
    }
  }
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
