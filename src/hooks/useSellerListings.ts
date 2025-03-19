
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching seller listings with proper RLS compliance
 * - 2024-09-22: Fixed type compatibility with cars table and CarListing interface
 * - 2024-09-23: Added proper type casting and improved db type compatibility
 * - 2024-11-21: Updated to use security definer function for RLS compatibility
 * - 2024-11-22: Fixed TypeScript errors with RPC function and type casting
 * - 2024-11-23: Fixed RPC function type compatibility issue using a more reliable approach
 * - 2024-11-24: Implemented a more direct query approach to bypass TypeScript limitations
 */

import { useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarListing } from "@/types/dashboard";
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
  features: any;
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
      // Use direct SQL query approach to bypass TypeScript RPC limitations
      // This uses a raw query with the security definer function via the REST API
      const res = await fetch(`${supabase.supabaseUrl}/rest/v1/rpc/get_seller_listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          p_seller_id: session.user.id
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error fetching seller listings:", errorData);
        throw new Error(`Failed to fetch listings: ${errorData.message || res.statusText}`);
      }
      
      const funcData = await res.json() as DbCarListing[];
      
      if (funcData && Array.isArray(funcData)) {
        return transformListingsData(funcData);
      }
      
      // If direct method fails or returns no data, fall back to direct query
      console.log("Falling back to direct query due to empty result or unexpected format");
      
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
      
      return transformListingsData(data as DbCarListing[] || []);
      
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
