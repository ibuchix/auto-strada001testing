
/**
 * Changes made:
 * - 2025-05-08: Created hook for checking seller role status
 * - 2025-05-08: Added multiple fallback checks for greater reliability
 * - 2025-05-08: Added RLS-safe function call for role verification
 */

import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSellerRoleCheck() {
  /**
   * Checks if the current user is a seller using multiple methods
   * @param session Current user session
   * @returns Boolean indicating if user is a seller
   */
  const checkSellerRole = async (session: Session): Promise<boolean> => {
    if (!session?.user) {
      return false;
    }
    
    try {
      // First method: Use security definer function
      try {
        const { data: functionResult, error: functionError } = await supabase.rpc(
          'is_verified_seller',
          { p_user_id: session.user.id }
        );
        
        if (!functionError && functionResult === true) {
          console.log("Seller verification succeeded via RPC function");
          return true;
        }
      } catch (err) {
        console.warn("Error checking seller status via RPC:", err);
      }
      
      // Second method: Check user metadata
      if (session.user.user_metadata?.role === 'seller') {
        console.log("Seller verification succeeded via user metadata");
        
        // Attempt to fix seller record if needed
        try {
          await supabase.rpc('ensure_seller_registration');
        } catch (error) {
          console.warn("Non-critical error ensuring seller registration:", error);
        }
        
        return true;
      }
      
      // Third method: Try to get seller profile directly (might fail with RLS)
      try {
        const { data: seller, error: sellerError } = await supabase
          .from('sellers')
          .select('is_verified')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (!sellerError && seller?.is_verified) {
          console.log("Seller verification succeeded via direct query");
          return true;
        }
      } catch (error) {
        console.warn("Error checking seller profile:", error);
      }
      
      // Fourth method: Check profile role
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (!profileError && profile?.role === 'seller') {
          console.log("Seller verification succeeded via profile role");
          
          // Attempt to fix seller record if needed
          try {
            await supabase.rpc('ensure_seller_registration');
          } catch (error) {
            console.warn("Non-critical error ensuring seller registration:", error);
          }
          
          return true;
        }
      } catch (error) {
        console.warn("Error checking profile role:", error);
      }
      
      return false;
    } catch (error) {
      console.error("Error in seller role check:", error);
      return false;
    }
  };

  return { checkSellerRole };
}
