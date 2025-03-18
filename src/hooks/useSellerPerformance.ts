
/**
 * Changes made:
 * - 2024-09-10: Created hook for fetching seller performance metrics data for the seller dashboard
 */

import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

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

    const { data, error } = await supabase
      .from('seller_performance_metrics')
      .select('*')
      .eq('seller_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the error code for "Results contain 0 rows" - not an error for us
      throw error;
    }

    return data as SellerPerformanceMetrics || {
      id: '',
      seller_id: session.user.id,
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
