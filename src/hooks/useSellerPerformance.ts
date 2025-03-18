
/**
 * Changes made:
 * - 2024-09-10: Created hook for fetching seller performance metrics data for the seller dashboard
 * - 2024-09-11: Updated to use the new service layer for Supabase interactions
 */

import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
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

  // Use React Query to fetch and cache the metrics
  const { 
    data: performanceMetrics,
    isLoading,
    error
  } = useQuery({
    queryKey: ['seller_performance', session?.user?.id],
    queryFn: fetchPerformanceMetrics,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    performanceMetrics,
    isLoading,
    error
  };
};
