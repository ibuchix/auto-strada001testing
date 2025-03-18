
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching auction results data for the seller dashboard
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

export interface AuctionResult {
  id: string;
  car_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  final_price: number | null;
  total_bids: number;
  unique_bidders: number;
  sale_status: string | null;
  created_at: string;
  auction_end_time?: string;
}

export const useAuctionResults = (session: Session | null) => {
  // Function to fetch auction results for this seller
  const fetchAuctionResults = async () => {
    if (!session?.user) throw new Error("No authenticated user");

    // Query the auction_results table joined with cars to get the relevant data
    const { data, error } = await supabase
      .from('auction_results')
      .select(`
        id,
        car_id,
        final_price,
        total_bids,
        unique_bidders,
        sale_status,
        created_at,
        cars:car_id (
          title,
          make,
          model,
          year,
          auction_end_time
        )
      `)
      .eq('cars.seller_id', session.user.id);

    if (error) throw error;

    // Transform the response to match our interface
    const results: AuctionResult[] = (data || []).map(item => ({
      id: item.id,
      car_id: item.car_id,
      title: item.cars?.title || 'Unknown Vehicle',
      make: item.cars?.make || 'Unknown',
      model: item.cars?.model || '',
      year: item.cars?.year || new Date().getFullYear(),
      final_price: item.final_price,
      total_bids: item.total_bids || 0,
      unique_bidders: item.unique_bidders || 0,
      sale_status: item.sale_status,
      created_at: item.created_at,
      auction_end_time: item.cars?.auction_end_time
    }));

    return results;
  };

  // Use React Query to fetch and cache the results
  const { 
    data: auctionResults = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ['auction_results', session?.user?.id],
    queryFn: fetchAuctionResults,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    auctionResults,
    isLoading,
    error
  };
};
