
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for seller role verification
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
 * - 2024-11-18: Enhanced fallback mechanisms for seller role detection
 */

import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook providing functions to check if a user has seller role
 * Uses multiple fallback methods to ensure reliable role detection
 */
export const useSellerRoleCheck = () => {
  /**
   * Efficiently checks if a user has seller role using multiple methods with fallbacks
   */
  const checkSellerRole = useCallback(async (currentSession: Session) => {
    try {
      // Method 1: Check user metadata first (fastest path)
      if (currentSession.user.user_metadata?.role === 'seller') {
        return true;
      }

      // Method 2: Check profiles table using the security definer function
      try {
        const { data: profile, error } = await supabase
          .rpc('get_profile', { p_user_id: currentSession.user.id });

        if (!error && profile && profile.length > 0 && profile[0]?.role === 'seller') {
          // Update user metadata to match profile role for future reference
          await supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          return true;
        }
      } catch (profileError) {
        // Don't throw here - continue to the next check method
        console.warn("Profile check via function failed, trying direct query:", profileError);
      }

      // Method 3: Direct profile query with explicit selection
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (!error && profile?.role === 'seller') {
          // Update user metadata to match profile role for future reference
          await supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          return true;
        }
      } catch (directQueryError) {
        // Don't throw here - continue to the next check method
        console.warn("Direct profile query failed, trying fallback methods:", directQueryError);
      }

      // Method 4: Check sellers table directly
      try {
        const { data: seller, error: sellerError } = await supabase
          .from('sellers')
          .select('id')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();
          
        if (!sellerError && seller) {
          // Found in sellers table - update user metadata
          await supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          // Also ensure profile table is synced
          await supabase
            .from('profiles')
            .upsert({ 
              id: currentSession.user.id, 
              role: 'seller',
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
          
          return true;
        }
      } catch (sellerError) {
        console.warn("Seller table check failed:", sellerError);
      }

      // Method 5: Use register_seller RPC if all else fails
      try {
        const { data: registerResult, error: registerError } = await supabase
          .rpc('register_seller', { p_user_id: currentSession.user.id });

        if (!registerError && registerResult) {
          console.log("Successfully registered as seller via RPC");
          return true;
        }
      } catch (registerError) {
        console.warn("Register seller RPC failed:", registerError);
      }
      
      // No seller status found after trying all methods
      return false;
    } catch (error) {
      console.error('Error checking seller role:', error);
      return false;
    }
  }, []);

  return { checkSellerRole };
};
