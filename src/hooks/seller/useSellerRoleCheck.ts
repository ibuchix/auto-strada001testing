
/**
 * Changes made:
 * - 2025-05-08: Created hook for checking seller role in various sources
 * - 2025-05-08: Added multiple verification methods with fallbacks
 * - 2025-05-08: Updated to use direct supabase client instance
 */

import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const useSellerRoleCheck = () => {
  /**
   * Check if a user has the seller role using multiple sources with fallbacks
   * This checks user metadata, profiles table, and sellers table
   */
  const checkSellerRole = useCallback(async (session: Session | null): Promise<boolean> => {
    try {
      if (!session?.user) {
        return false;
      }

      // First check: User metadata (fastest, no DB query)
      if (session.user.user_metadata?.role === "seller") {
        console.log("User has seller role in metadata");
        return true;
      }

      // Second check: Profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profileError && profileData?.role === "seller") {
        console.log("User has seller role in profiles table");
        return true;
      }

      // Third check: Sellers table
      const { data: sellerData, error: sellerError } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!sellerError && sellerData) {
        console.log("User exists in sellers table");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking seller role:", error);
      return false;
    }
  }, []);

  return { checkSellerRole };
};
