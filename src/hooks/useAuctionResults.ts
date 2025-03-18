
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching auction results data for the seller dashboard
 * - 2024-09-09: Fixed query relationship between cars and auction_results tables
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

    // First fetch the cars owned by this seller
    const { data: sellerCars, error: carError } = await supabase
      .from('cars')
      .select('id, title, make, model, year, auction_end_time')
      .eq('seller_id', session.user.id);

    if (carError) throw carError;

    if (!sellerCars || sellerCars.length === 0) {
      return []; // No cars found for this seller
    }

    // Get all car IDs
    const carIds = sellerCars.map(car => car.id);

    // Then fetch auction results for these cars
    const { data: resultsData, error: resultsError } = await supabase
      .from('auction_results')
      .select('id, car_id, final_price, total_bids, unique_bidders, sale_status, created_at')
      .in('car_id', carIds);

    if (resultsError) throw resultsError;

    // Combine the data
    const results: AuctionResult[] = (resultsData || []).map(result => {
      // Find the corresponding car details
      const car = sellerCars.find(c => c.id === result.car_id);
      
      return {
        id: result.id,
        car_id: result.car_id,
        title: car?.title || 'Unknown Vehicle',
        make: car?.make || 'Unknown',
        model: car?.model || '',
        year: car?.year || new Date().getFullYear(),
        final_price: result.final_price,
        total_bids: result.total_bids || 0,
        unique_bidders: result.unique_bidders || 0,
        sale_status: result.sale_status,
        created_at: result.created_at,
        auction_end_time: car?.auction_end_time
      };
    });

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
