
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching auction results with proper RLS compliance
 * - 2024-09-22: Fixed interface export and useOptimizedQuery parameter format
 * - 2024-09-23: Fixed query parameter format to match updated useOptimizedQuery
 * - 2024-10-16: Updated to use updated useOptimizedQuery function with proper parameter syntax
 * - 2025-06-12: Added reserve_price to AuctionResult interface to fix TypeScript errors
 */

import { Session } from "@supabase/supabase-js";
import { useOptimizedQuery } from "./useOptimizedQuery";
import { auctionService } from "@/services/supabase/auctionService";

// Export the interface so it can be imported by other components
export interface AuctionResult {
  id: string;
  car_id: string;
  final_price: number | null;
  total_bids: number;
  unique_bidders: number;
  sale_status: string | null;
  created_at: string;
  // Optional fields from joined car data
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  auction_end_time?: string;
  reserve_price?: number; // Added reserve_price property
}

export const useAuctionResults = (session: Session | null) => {
  // Function to fetch auction results for the authenticated seller
  const fetchAuctionResults = async () => {
    if (!session?.user) throw new Error("No authenticated user");
    
    return await auctionService.getSellerAuctionResults(session.user.id);
  };

  // Use the optimized query hook to fetch results with proper caching and error handling
  return useOptimizedQuery(
    ['auction_results', session?.user?.id],
    fetchAuctionResults,
    {
      enabled: !!session?.user,
      requireAuth: true, // This ensures the query only runs if the user is authenticated
      cacheKey: session?.user?.id ? `auction_results_${session.user.id}` : undefined,
    }
  );
};
