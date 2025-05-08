
/**
 * Changes made:
 * - 2025-05-20: Created service to handle seller performance metrics retrieval
 * - 2025-05-20: Implemented secure RPC function calls to bypass RLS restrictions
 * - 2025-05-21: Fixed TypeScript errors with proper interface handling
 */

import { BaseService } from "./baseService";
import { SellerPerformanceMetrics } from "@/hooks/useSellerPerformance";

export class SellerPerformanceService extends BaseService {
  /**
   * Get performance metrics for a seller using security definer function
   * This bypasses RLS and ensures proper data access
   */
  async getSellerPerformanceMetrics(sellerId: string) {
    try {
      console.log('Fetching performance metrics for seller:', sellerId);
      
      // Use the secure RPC function to fetch metrics
      const { data, error } = await this.supabase
        .rpc('fetch_seller_performance', { p_seller_id: sellerId });
      
      if (error) {
        console.error('Error fetching seller performance metrics:', error);
        throw error;
      }
      
      if (!data || Object.keys(data).length === 0) {
        console.log('No performance metrics found for seller:', sellerId);
        return null;
      }
      
      console.log('Successfully retrieved performance metrics');
      return data as SellerPerformanceMetrics;
    } catch (error: any) {
      this.handleError(error, "Failed to fetch seller performance metrics");
      return null;
    }
  }
}

// Export a singleton instance
export const sellerPerformanceService = new SellerPerformanceService();
