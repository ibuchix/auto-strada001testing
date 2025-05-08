
/**
 * Hook for managing seller session data and registration status
 * Created: 2025-05-20
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export const useSellerSession = () => {
  const { session } = useAuth();
  const [isSeller, setIsSeller] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const checkSellerStatus = async () => {
    if (!session?.user) {
      setIsSeller(false);
      setIsLoading(false);
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // First check if user has the seller role in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('Error checking seller profile:', profileError);
        // Don't throw here, proceed to try to fix registration
      }
      
      // Check if they need to be registered as a seller
      if (!profile || profile.role !== 'seller') {
        console.log('User is not registered as a seller, attempting registration');
        
        // Call our function to ensure they are registered
        const { data: regResult, error: regError } = await supabase
          .rpc('ensure_seller_registration');
        
        if (regError) {
          console.error('Failed to register seller:', regError);
          throw regError;
        }
        
        console.log('Seller registration result:', regResult);
        setIsSeller(regResult?.success || false);
        return regResult?.success || false;
      }
      
      // They already have the seller role, check if they have a seller record
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('is_verified')
        .eq('user_id', session.user.id)
        .single();
      
      if (sellerError) {
        console.error('Error checking seller record:', sellerError);
        // Try to fix registration
        const { data: regResult, error: regError } = await supabase
          .rpc('ensure_seller_registration');
          
        if (regError) {
          console.error('Failed to register seller:', regError);
          throw regError;
        }
        
        setIsSeller(regResult?.success || false);
        return regResult?.success || false;
      }
      
      // Success, they are a valid seller
      setIsSeller(true);
      return true;
    } catch (err: any) {
      console.error('Error in seller session check:', err);
      setError(err);
      setIsSeller(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check seller status on session change
  useEffect(() => {
    checkSellerStatus();
  }, [session]);
  
  const refreshSellerStatus = async (): Promise<boolean> => {
    return await checkSellerStatus();
  };
  
  return { 
    isSeller, 
    isLoading, 
    error,
    refreshSellerStatus
  };
};
