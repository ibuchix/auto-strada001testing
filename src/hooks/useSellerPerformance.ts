
/**
 * Hook for accessing seller performance metrics
 * Created: 2025-05-08
 * Updated: 2025-05-20 - Updated to use secure RPC function
 */

import { useQuery } from '@tanstack/react-query';
import { Session } from '@supabase/supabase-js';
import { sellerPerformanceService } from '@/services/supabase/sellerPerformanceService';

export interface SellerPerformanceMetrics {
  seller_id: string;
  total_listings: number;
  active_listings: number;
  sold_listings: number;
  cancelled_listings: number;
  total_earnings: number;
  average_time_to_sell?: string;
  average_price?: number;
  highest_price_sold?: number;
  reserve_price_met_rate?: number;
  listing_approval_rate?: number;
  last_listing_date?: string;
  last_sale_date?: string;
  created_at: string;
  updated_at: string;
}

export const useSellerPerformance = (session: Session | null) => {
  return useQuery<SellerPerformanceMetrics | null>({
    queryKey: ['seller-performance', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        return null;
      }

      try {
        // Use the service to get performance metrics
        const metrics = await sellerPerformanceService.getSellerPerformanceMetrics(session.user.id);
        return metrics as SellerPerformanceMetrics; 
      } catch (error) {
        console.error('Error fetching seller performance metrics:', error);
        return null;
      }
    },
    enabled: !!session?.user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};
