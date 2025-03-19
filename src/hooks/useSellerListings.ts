
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching seller listings with proper RLS compliance
 * - 2024-09-22: Fixed type compatibility with cars table and CarListing interface
 * - 2024-09-23: Added proper type casting and improved db type compatibility
 * - 2024-11-21: Updated to use security definer function for RLS compatibility
 */

import { useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarListing } from "@/types/dashboard";
import { transformFeaturesFromDb } from "@/types/forms";
import { Json } from "@/integrations/supabase/types";
import { AuthErrorHandler } from "@/components/error-handling/AuthErrorHandler";
import { toast } from "sonner";

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
  const [error, setError] = useState<string | null>(null);
  const [isRlsError, setIsRlsError] = useState(false);
  
  // Function to force a refresh of the listings
  const forceRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setError(null);
    setIsRlsError(false);
  }, []);
  
  // Function to fetch listings for the seller with better RLS handling
  const fetchListings = async () => {
    if (!session?.user) {
      throw new Error("No authenticated user");
    }
    
    try {
      // First try using the security definer function (bypasses RLS)
      const { data: funcData, error: funcError } = await supabase
        .rpc('get_seller_listings', { 
          p_seller_id: session.user.id 
        });
        
      if (!funcError && funcData) {
        return transformListingsData(funcData);
      }
      
      if (funcError) {
        console.warn("Security definer function failed, falling back to direct query:", funcError);
        
        // Direct query as fallback (relies on RLS policies)
        const { data, error } = await supabase
          .from("cars")
          .select("*")
          .eq("seller_id", session.user.id)
          .order("updated_at", { ascending: false });
          
        if (error) {
          if (error.code === '42501' || error.message.includes('permission denied')) {
            setIsRlsError(true);
            setError("Permission denied. Row-level security is preventing access to your listings.");
            
            // Show a helpful toast
            toast.error("Access denied to your listings", {
              description: "This appears to be a database permission issue. Please contact support.",
            });
          } else {
            setError(error.message);
          }
          throw error;
        }
        
        return transformListingsData(data || []);
      }
      
      return [];
    } catch (error: any) {
      console.error("Error fetching seller listings:", error);
      throw error;
    }
  };
  
  // Helper function to transform database results to match the CarListing type
  const transformListingsData = (data: DbCarListing[]): CarListing[] => {
    return data.map((item: DbCarListing): CarListing => ({
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
  const { data: listings, isLoading, error: queryError } = useQuery({
    queryKey: ['seller_listings', session?.user?.id, refreshKey],
    queryFn: fetchListings,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Only retry once to avoid hammering the API
    retryDelay: 1000,
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
    error: error || (queryError instanceof Error ? queryError.message : null),
    isRlsError,
    forceRefresh
  };
};
