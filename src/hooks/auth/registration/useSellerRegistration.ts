
/**
 * useSellerRegistration hook
 * Created: 2025-06-20 - Extracted from original useAuthActions for better modularity
 * 
 * Handles seller registration with the Supabase database
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthRegisterResult } from "../types";

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

      // Step 1: Create a record in the sellers table
      const { error: sellerError } = await supabase
        .from("sellers")
        .insert({
          user_id: userId,
          status: "active",
          created_at: new Date().toISOString(),
        })
        .single();

      if (sellerError) {
        // If the error is about uniqueness, the seller record might already exist
        if (sellerError.code === "23505") {
          console.log("Seller record already exists for user:", userId);
        } else {
          console.error("Failed to create seller record:", sellerError);
          throw new Error(`Failed to create seller record: ${sellerError.message}`);
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
