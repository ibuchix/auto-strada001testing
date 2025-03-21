
/**
 * Changes made:
 * - 2024-10-15: Extracted response handling functionality from baseService.ts
 */

import { QueryOptimizationService } from "./queryOptimizationService";

export class ResponseHandlingService extends QueryOptimizationService {
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
