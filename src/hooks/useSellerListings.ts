
/**
 * Fixed CarListing import and enhanced the hook to support different listing types
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { CarListing } from "@/types/dashboard";  // Changed import to dashboard

export const useSellerListings = (session: any) => {
  const [listings, setListings] = useState<CarListing[]>([]);
  const [activeListings, setActiveListings] = useState<CarListing[]>([]);
  const [draftListings, setDraftListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRlsError, setIsRlsError] = useState(false);

  const fetchListings = async (userId: string) => {
    setLoading(true);
    setError(null);
    setIsRlsError(false);
    
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // Check for RLS policy errors
        if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
          setIsRlsError(true);
          throw new Error("Permission denied. Your account may need to be properly initialized.");
        }
        throw error;
      }

      // Transform the data to match the CarListing interface
      const transformedData: CarListing[] = (data || []).map((car: any) => ({
        id: car.id,
        title: car.title || `${car.make} ${car.model} ${car.year}`,
        make: car.make || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        status: car.status || 'unknown',
        price: car.price || 0,
        currentBid: car.current_bid,
        createdAt: car.created_at,
        features: car.features || { 
          satNav: false, 
          panoramicRoof: false,
          reverseCamera: false,
          heatedSeats: false,
          upgradedSound: false
        },
        photos: car.images || car.additional_photos || [],
        is_draft: car.is_draft || false,
        seller_id: car.seller_id,
        auction_status: car.auction_status || 'draft'
      }));

      setListings(transformedData);
      
      // Split into active and draft listings
      setActiveListings(transformedData.filter(car => !car.is_draft));
      setDraftListings(transformedData.filter(car => car.is_draft));
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      setError(error.message || "Failed to fetch listings");
      toast.error("Failed to fetch listings", {
        description: error.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const forceRefresh = () => {
    if (session?.user?.id) {
      fetchListings(session.user.id);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchListings(session.user.id);
    } else {
      setLoading(false);
    }
  }, [session]);

  return {
    listings,
    activeListings,
    draftListings,
    loading,
    isLoading: loading,
    error,
    isRlsError,
    refetchListings: forceRefresh,
    forceRefresh
  };
};
