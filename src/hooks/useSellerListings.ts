
/**
 * Changes made:
 * - 2024-08-22: Created useSellerListings hook from SellerDashboard refactoring
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Session } from "@supabase/supabase-js";
import { Json } from "@/integrations/supabase/types";
import { CarListing } from "@/types/dashboard";

export const useSellerListings = (session: Session | null) => {
  const [activeListings, setActiveListings] = useState<CarListing[]>([]);
  const [draftListings, setDraftListings] = useState<CarListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sellerProfile, setSellerProfile] = useState<any>(null);

  const forceRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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

  // Fetch listings
  useEffect(() => {
    if (!session?.user) return;

    const fetchListings = async () => {
      setIsLoading(true);
      try {
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

        // Filter active and draft listings
        const activeCars = transformedData.filter(car => !car.is_draft);
        const draftCars = transformedData.filter(car => car.is_draft);

        setActiveListings(activeCars);
        setDraftListings(draftCars);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load your listings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListings();
  }, [session, refreshTrigger]);

  return {
    activeListings,
    draftListings,
    isLoading,
    sellerProfile,
    forceRefresh
  };
};
