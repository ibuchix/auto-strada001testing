
/**
 * Changes made:
 * - 2024-09-26: Created useSellerProfile hook to fetch seller profile data
 * - 2024-09-27: Fixed table name to use 'sellers' instead of non-existent 'seller_profiles'
 */

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SellerProfile {
  id: string;
  user_id: string;
  is_verified: boolean;
  created_at: string;
  full_name?: string;
  company_name?: string;
  address?: string;
  tax_id?: string;
  verification_status: string;
  updated_at: string;
}

export const useSellerProfile = (session: Session | null) => {
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSellerProfile = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('sellers')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;
        
        setSellerProfile(data as SellerProfile);
      } catch (err: any) {
        console.error('Error fetching seller profile:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerProfile();
  }, [session]);

  return { sellerProfile, isLoading, error };
};
