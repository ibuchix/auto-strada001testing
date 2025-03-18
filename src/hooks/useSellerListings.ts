
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching seller listings with proper RLS compliance
 */

import { useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarListing } from "@/types/forms";

export const useSellerListings = (session: Session | null) => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Function to force a refresh of the listings
  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  // Function to fetch listings for the seller
  // RLS will automatically filter listings to only show the seller's own listings
  const fetchListings = async () => {
    if (!session?.user) {
      throw new Error("No authenticated user");
    }
    
    // With RLS policies in place, we don't need to explicitly filter by seller_id
    // RLS will automatically filter results to only the user's listings
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("updated_at", { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  };
  
  // Use React Query to handle data fetching
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['seller_listings', session?.user?.id, refreshKey],
    queryFn: fetchListings,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Separate active listings from drafts
  const activeListings = listings?.filter(
    (listing: CarListing) => !listing.is_draft
  ) || [];
  
  const draftListings = listings?.filter(
    (listing: CarListing) => listing.is_draft
  ) || [];
  
  return {
    activeListings,
    draftListings,
    isLoading,
    error,
    forceRefresh
  };
};
