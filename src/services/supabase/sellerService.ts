
/**
 * Changes made:
 * - 2024-09-11: Created seller service for all seller-related operations
 * - 2024-09-12: Removed redundant code trying to register service
 * - 2024-09-19: Optimized queries for better performance and reduced latency
 */

import { BaseService } from "./baseService";
import { SellerPerformanceMetrics } from "@/hooks/useSellerPerformance";

export class SellerService extends BaseService {
  /**
   * Get seller performance metrics with optimized column selection
   */
  async getSellerPerformanceMetrics(sellerId: string): Promise<SellerPerformanceMetrics | null> {
    try {
      // Select only the columns we need
      const { data, error } = await this.supabase
        .from('seller_performance_metrics')
        .select(`
          id, seller_id, total_listings, sold_listings, active_listings,
          cancelled_listings, total_earnings, average_price,
          highest_price_sold, reserve_price_met_rate, listing_approval_rate,
          last_listing_date, last_sale_date
        `)
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Return default values if no metrics exist yet
        return {
          id: '',
          seller_id: sellerId,
          total_listings: 0,
          sold_listings: 0,
          active_listings: 0,
          cancelled_listings: 0,
          total_earnings: 0,
          average_price: null,
          highest_price_sold: null,
          reserve_price_met_rate: null,
          listing_approval_rate: null,
          last_listing_date: null,
          last_sale_date: null
        };
      }
      
      return data as SellerPerformanceMetrics;
    } catch (error: any) {
      console.error("Error fetching seller performance metrics:", error);
      return null;
    }
  }
  
  /**
   * Get seller profile with optimized column selection
   */
  async getSellerProfile(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('sellers')
        .select(`
          id, user_id, full_name, company_name, 
          tax_id, verification_status, is_verified
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error: any) {
      this.handleError(error, "Failed to fetch seller profile");
    }
  }
}

// Export a singleton instance
export const sellerService = new SellerService();
