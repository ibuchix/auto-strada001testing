/**
 * Updated: 2025-05-29 - Removed price field references and is_draft field to match simplified schema
 */

import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import { Json } from '@/types/supabase';

interface DbCarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  reserve_price: number;
  mileage: number;
  status: string;
  created_at: string;
  updated_at: string;
  current_bid: number;
  seller_id: string;
  additional_photos: Json;
  address: string;
  auction_end_time: string;
  auction_status: string;
  features: Json;
  finance_amount: number;
  has_private_plate: boolean;
  has_service_history: boolean;
  is_damaged: boolean;
  is_registered_in_poland: boolean;
  mobile_number: string;
  number_of_keys: number;
  registration_number: string;
  seat_material: string;
  seller_notes: string;
  service_history_type: string;
  vin: string;
}

export const useSellerListings = () => {
  const [listings, setListings] = useState<DbCarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();
  const session = useSession();

  const fetchListings = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('seller_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match expected interface
      const transformedData = data.map(item => ({
        ...item,
        reserve_price: item.reserve_price || 0,
      })) as DbCarListing[];

      setListings(transformedData);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return {
    listings,
    loading,
    fetchListings,
  };
};
