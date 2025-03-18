
/**
 * Changes made:
 * - 2024-09-26: Created useSellerProfile hook to fetch seller profile data
 */

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SellerProfile {
  id: string;
  user_id: string;
  is_verified: boolean;
  created_at: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
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
          .from('seller_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

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
