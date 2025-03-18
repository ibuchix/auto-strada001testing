
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching seller listings with proper RLS compliance
 * - 2024-09-22: Fixed type compatibility with cars table and CarListing interface
 * - 2024-09-23: Added proper type casting and improved db type compatibility
 */

import { useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarListing } from "@/types/dashboard";
import { transformFeaturesFromDb } from "@/types/forms";
import { Json } from "@/integrations/supabase/types";

// Define a type that matches what comes from the database
interface DbCarListing {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  make: string;
  model: string;
  year: number;
  is_draft: boolean;
  is_auction: boolean;
  features: Json;
  description?: string;
  updated_at?: string;
  [key: string]: any; // Allow other fields from the database
}

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
    
    // Transform the database results to match the CarListing type
    return (data || []).map((item: DbCarListing): CarListing => ({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      price: item.price,
      status: item.status,
      created_at: item.created_at,
      make: item.make || '',
      model: item.model || '',
      year: item.year || new Date().getFullYear(),
      is_draft: item.is_draft,
      is_auction: item.is_auction || false,
      auction_status: item.auction_status,
      mileage: item.mileage,
      images: item.images,
      updated_at: item.updated_at,
      // Add any other required fields from CarListing interface
    }));
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
    (listing) => !listing.is_draft
  ) || [];
  
  const draftListings = listings?.filter(
    (listing) => listing.is_draft
  ) || [];
  
  return {
    activeListings,
    draftListings,
    isLoading,
    error,
    forceRefresh
  };
};
