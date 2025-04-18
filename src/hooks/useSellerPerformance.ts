
/**
 * Changes made:
 * - 2024-09-10: Created hook for fetching seller performance metrics data for the seller dashboard
 * - 2024-09-11: Updated to use the new service layer for Supabase interactions
 * - 2024-09-21: Updated to respect RLS policies
 * - 2024-09-22: Fixed useOptimizedQuery parameter format
 * - 2024-09-23: Fixed query parameter format to match updated useOptimizedQuery
 * - 2024-10-16: Updated to use updated useOptimizedQuery function with proper parameter syntax
 */

import { Session } from "@supabase/supabase-js";
import { useOptimizedQuery } from "./useOptimizedQuery";
import { sellerService } from "@/services/supabase/sellerService";

export interface SellerPerformanceMetrics {
  id: string;
  seller_id: string;
  total_listings: number;
  sold_listings: number;
  active_listings: number;
  cancelled_listings: number;
  total_earnings: number;
  average_price: number | null;
  highest_price_sold: number | null;
  reserve_price_met_rate: number | null;
  listing_approval_rate: number | null;
  last_listing_date: string | null;
  last_sale_date: string | null;
}

export const useSellerPerformance = (session: Session | null) => {
  // Function to fetch seller performance metrics
  const fetchPerformanceMetrics = async () => {
    if (!session?.user) throw new Error("No authenticated user");
    
    return await sellerService.getSellerPerformanceMetrics(session.user.id);
  };

  // Use React Query with RLS-compliant options
  return useOptimizedQuery(
    ['seller_performance', session?.user?.id],
    fetchPerformanceMetrics,
    {
      enabled: !!session?.user,
      requireAuth: true, // Requires authentication for RLS to work
      cacheKey: session?.user?.id ? `seller_performance_${session.user.id}` : undefined,
    }
  );
};
