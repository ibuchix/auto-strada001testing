
/**
 * Changes made:
 * - 2024-09-08: Created hook for fetching seller listings with proper RLS compliance
 * - 2024-09-22: Fixed type compatibility with cars table and CarListing interface
 * - 2024-09-23: Added proper type casting and improved db type compatibility
 * - 2024-11-21: Updated to use security definer function for RLS compatibility
 * - 2024-11-22: Fixed TypeScript errors with RPC function and type casting
 * - 2024-11-23: Fixed RPC function type compatibility issue using a more reliable approach
 * - 2024-11-24: Implemented a more direct query approach to bypass TypeScript limitations
 * - 2024-11-25: Fixed TypeScript errors by accessing Supabase URL and key properly
 * - 2025-05-08: Included valuation_data in query and transformation logic
 * - 2025-05-08: Added reserve_price field to data transformation
 * - 2025-05-08: Enhanced error recovery with ensure_seller_registration function
 * - 2025-07-19: Improved error handling for RLS issues and auth errors
 */

import { useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarListing } from "@/types/dashboard";
import { toast } from "sonner";

// Get the Supabase URL and key from the environment variables
// These are the same values used when creating the supabase client
const SUPABASE_URL = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";

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
  valuation_data?: any;
  reserve_price?: number; // Added reserve_price field
  [key: string]: any; // Allow other fields from the database
}

export const useSellerListings = (session: Session | null) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRlsError, setIsRlsError] = useState(false);
  
  // Function to force a refresh of the listings
  const forceRefresh = useCallback(() => {
    console.log('Forcing refresh of seller listings');
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
      console.log(`Fetching listings for user: ${session.user.id}`);
      
      // First, try to ensure proper seller registration
      try {
        await supabase.rpc('ensure_seller_registration');
      } catch (ensureError) {
        console.warn("Non-critical error ensuring seller registration:", ensureError);
      }
      
      // Use direct SQL query approach to bypass TypeScript RPC limitations
      // This uses a raw query with the security definer function via the REST API
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_seller_listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
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
      console.log(`Received ${funcData?.length || 0} listings from Supabase`);
      
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
        console.error("Error in direct query:", error);
        if (error.code === '42501' || error.message.includes('permission denied')) {
          setIsRlsError(true);
          setError("Permission denied. Let's try to fix your seller account status.");
          
          // Try to repair registration on error
          try {
            console.log("Attempting to repair seller registration due to RLS error");
            await supabase.rpc('ensure_seller_registration');
            
            // If repair succeeded, retry the query
            const { data: retryData, error: retryError } = await supabase
              .from("cars")
              .select("*")
              .eq("seller_id", session.user.id)
              .order("updated_at", { ascending: false });
              
            if (!retryError && retryData) {
              console.log("Successfully recovered from RLS error after registration repair");
              return transformListingsData(retryData as DbCarListing[] || []);
            }
          } catch (repairError) {
            console.error("Failed to repair seller registration:", repairError);
          }
          
          // Show a helpful toast
          toast.error("Access denied to your listings", {
            description: "We're trying to fix this automatically. Please try refreshing the page.",
          });
        } else {
          setError(error.message);
        }
        throw error;
      }
      
      console.log(`Received ${data?.length || 0} listings from direct query`);
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
      valuation_data: item.valuation_data,
      reserve_price: item.reserve_price, // Include reserve_price in transformation
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
