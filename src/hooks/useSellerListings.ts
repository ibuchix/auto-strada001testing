
/**
 * Changes made:
 * - 2024-09-05: Created useSellerListings hook from SellerDashboard refactoring
 * - 2024-09-07: Enhanced with React Query for better integration with real-time updates
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { CarListing } from "@/types/dashboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useSellerListings = (session: Session | null) => {
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const queryClient = useQueryClient();

  // Function to fetch listings from Supabase
  const fetchListings = useCallback(async () => {
    if (!session?.user) throw new Error("No authenticated user");

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match CarListing interface with description field
    const transformedData: CarListing[] = (data || []).map(car => {
      // Use features.seller_notes for description if available, otherwise use empty string
      const features = car.features as Json || {};
      const sellerNotes = typeof features === 'object' && features !== null 
        ? ((features as Record<string, any>).seller_notes as string) || '' 
        : '';
      
      return {
        id: car.id,
        title: car.title || `${car.make || 'Unknown'} ${car.model || ''} ${car.year || ''}`.trim(),
        price: car.price || 0,
        status: car.status || 'available',
        created_at: car.created_at,
        make: car.make || 'Unknown',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        is_draft: car.is_draft,
        is_auction: car.is_auction || false,
        description: sellerNotes
      };
    });

    return transformedData;
  }, [session]);

  // Use React Query to fetch and cache listings
  const { 
    data: listings = [], 
    isLoading,
    error
  } = useQuery({
    queryKey: ['seller_listings', session?.user?.id],
    queryFn: fetchListings,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Filter listings into active and draft categories
  const activeListings = listings.filter(car => !car.is_draft);
  const draftListings = listings.filter(car => car.is_draft);

  // Force refresh function that invalidates the query
  const forceRefresh = useCallback(() => {
    if (session?.user?.id) {
      queryClient.invalidateQueries({ queryKey: ['seller_listings', session.user.id] });
    }
  }, [queryClient, session]);

  // Fetch seller profile
  useEffect(() => {
    if (!session?.user) return;

    const fetchSellerProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('sellers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching seller profile:', error);
          // If no seller profile exists, try to create one using the register_seller function
          const { data: registerResult, error: registerError } = await supabase.rpc('register_seller', {
            p_user_id: session.user.id
          });
          
          if (registerError) {
            console.error('Error registering seller:', registerError);
          } else {
            // Refetch the profile after registration
            const { data: newProfile, error: refetchError } = await supabase
              .from('sellers')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            if (!refetchError && newProfile) {
              setSellerProfile(newProfile);
            }
          }
        } else {
          setSellerProfile(data);
        }
      } catch (e) {
        console.error('Error fetching seller profile:', e);
      }
    };

    fetchSellerProfile();
  }, [session]);

  // Show error toast if listings fetch fails
  useEffect(() => {
    if (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load your listings');
    }
  }, [error]);

  return {
    activeListings,
    draftListings,
    isLoading,
    sellerProfile,
    forceRefresh
  };
};
