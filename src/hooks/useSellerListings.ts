/**
 * Fixed CarListing import
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { CarListing } from "@/types/forms";

export const useSellerListings = () => {
  const { session } = useAuth();
  const [listings, setListings] = useState<CarListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchListings(session.user.id);
    }
  }, [session]);

  const fetchListings = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setListings(data || []);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch listings", {
        description: error.message || "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    listings,
    loading,
    refetchListings: () => session ? fetchListings(session.user.id) : null,
  };
};
