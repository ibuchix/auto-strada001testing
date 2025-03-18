
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching auction results with proper RLS compliance
 */

import { Session } from "@supabase/supabase-js";
import { useOptimizedQuery } from "./useOptimizedQuery";
import { auctionService, AuctionResult } from "@/services/supabase/auctionService";

export const useAuctionResults = (session: Session | null) => {
  // Function to fetch auction results for the authenticated seller
  const fetchAuctionResults = async () => {
    if (!session?.user) throw new Error("No authenticated user");
    
    return await auctionService.getSellerAuctionResults(session.user.id);
  };

  // Use the optimized query hook to fetch results with proper caching and error handling
  const { 
    data: auctionResults,
    isLoading,
    error
  } = useOptimizedQuery({
    queryKey: ['auction_results', session?.user?.id],
    queryFn: fetchAuctionResults,
    enabled: !!session?.user,
    requireAuth: true, // This ensures the query only runs if the user is authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    auctionResults: auctionResults || [],
    isLoading,
    error
  };
};
