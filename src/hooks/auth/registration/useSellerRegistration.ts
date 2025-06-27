
/**
 * useSellerRegistration hook
 * Created: 2025-06-20 - Extracted from original useAuthActions for better modularity
 * Updated: 2025-06-21 - Fixed database field naming to match schema (status → verification_status and is_verified)
 * Updated: 2025-06-22 - Added RPC fallback for permission denied errors
 * 
 * Handles seller registration with the Supabase database
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthRegisterResult } from "../types";
import { tryRpcRegistration } from "./utils/rpcUtils";

/**
 * Hook for handling seller registration
 */
export const useSellerRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  /**
   * Register a user as a seller by creating a seller record
   * and updating the user's role in metadata and profiles
   */
  const registerSeller = async (userId: string): Promise<boolean> => {
    if (!userId) {
      console.error("Cannot register seller: No user ID provided");
      return false;
    }

    try {
      setIsLoading(true);
      console.log("Registering user as seller:", userId);

      // First try using the RPC function (bypasses RLS)
      const rpcResult = await tryRpcRegistration(supabase, userId);

      if (rpcResult.success) {
        toast.success("Registered as seller successfully");
        return true;
      }

      // If RPC fails, try the direct approach

      // Step 1: Create a record in the sellers table
      const { error: sellerError } = await supabase
        .from("sellers")
        .insert({
          user_id: userId,
          verification_status: "verified",
          is_verified: true,
          created_at: new Date().toISOString(),
        })
        .single();

      if (sellerError) {
        // If the error is about uniqueness, the seller record might already exist
        if (sellerError.code === "23505") {
          console.log("Seller record already exists for user:", userId);
        } else {
          console.error("Failed to create seller record:", sellerError);

          // Special case for permission denied - try RPC again with no arguments
          if (sellerError.code === '42501' || sellerError.message.includes('permission denied')) {
            console.log("Permission denied error, trying no-argument RPC function");

            const { error: rpcError } = await supabase.rpc('ensure_seller_registration');

            if (rpcError) {
              console.error("Failed to use ensure_seller_registration:", rpcError);
              throw new Error(`Failed to register seller via any method: ${sellerError.message}`);
            } else {
              console.log("Successfully registered via no-argument RPC function");
              toast.success("Registered as seller successfully");
              return true;
            }
          } else {
            throw new Error(`Failed to create seller record: ${sellerError.message}`);
          }
        }
      }

      // Step 2: Update the user's role in metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: "seller" },
      });

      if (updateError) {
        console.error("Failed to update user role in metadata:", updateError);
        throw new Error(`Failed to update user role: ${updateError.message}`);
      }

      // Step 3: Update the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: "seller" })
        .eq("id", userId);

      if (profileError) {
        console.error("Failed to update user role in profiles:", profileError);
        // Continue anyway since metadata update was successful
      }

      console.log("Successfully registered user as seller:", userId);
      toast.success("Registered as seller successfully");

      return true;
    } catch (error: any) {
      console.error("Error in seller registration:", error);
      toast.error("Failed to register as seller", {
        description: error.message,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    registerSeller,
  };
};
