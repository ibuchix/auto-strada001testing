
/**
 * Changes made:
 * - 2024-03-28: Created useAuth hook to handle authentication logic
 * - 2024-03-29: Updated type definitions to ensure consistency with form data
 * - 2024-03-31: Fixed DealerData type to make all fields required
 * - 2024-04-01: Fixed type mismatch between DealerData and form submission
 * - 2024-06-24: Added registerSeller function for seller registration
 * - 2024-06-25: Fixed registerSeller implementation to properly update user role
 * - 2024-06-28: Removed dealer-specific functionality to make app seller-specific
 * - 2024-07-05: Updated registerSeller to use the database function for more reliable registration
 * - 2024-07-06: Enhanced error handling and added better validation for seller registration
 * - 2024-12-18: Improved registerSeller with progressive fallback methods for robustness
 * - 2024-12-22: Added debug logging and improved profiles update logic
 */

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabaseClient = useSupabaseClient();
  
  const registerSeller = async (userId: string) => {
    try {
      setIsLoading(true);
      console.log("Starting seller registration process for user:", userId);
      
      // First check if the user already has a role
      const { data: user, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        throw new Error("Could not verify user account");
      }

      // Check if user already has seller role
      const hasSellerRole = user.user?.user_metadata?.role === 'seller';
      console.log("User metadata:", user.user?.user_metadata, "Has seller role:", hasSellerRole);

      if (hasSellerRole) {
        console.log("User already has seller role in metadata");
        
        // Still update cache to ensure consistency
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: user.user.id,
          role: 'seller',
          updated_at: new Date().toISOString()
        });
        
        // Check if seller entry exists
        const { data: sellerExists, error: sellerCheckError } = await supabaseClient
          .from('sellers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (sellerCheckError) {
          console.error("Error checking if seller exists:", sellerCheckError);
        }
          
        if (sellerExists) {
          console.log("Seller record already exists:", sellerExists);
          return true;
        }
        
        console.log("Seller role found in metadata but no seller record exists. Creating...");
      }

      console.log("Updating user metadata with seller role");
      // Update user metadata to include role
      const { error: metadataError } = await supabaseClient.auth.updateUser({
        data: { role: 'seller' }
      });

      if (metadataError) {
        console.error("Error updating user metadata:", metadataError);
        throw new Error("Failed to update user role");
      }
      
      // First check if profile exists before creating or updating
      const { data: profileExists, error: profileCheckError } = await supabaseClient
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileCheckError) {
        console.error("Error checking profile:", profileCheckError);
      }
      
      // Create or update profile with seller role
      if (profileExists) {
        console.log("Profile exists, updating with seller role:", profileExists);
        const { error: profileUpdateError } = await supabaseClient
          .from('profiles')
          .update({ 
            role: 'seller',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (profileUpdateError) {
          console.error("Error updating profile:", profileUpdateError);
        }
      } else {
        console.log("Profile doesn't exist, creating with seller role");
        const { error: profileCreateError } = await supabaseClient
          .from('profiles')
          .insert({ 
            id: userId, 
            role: 'seller',
            updated_at: new Date().toISOString()
          });
          
        if (profileCreateError) {
          console.error("Error creating profile:", profileCreateError);
        }
      }
          
      // Check if seller record exists, create if needed
      const { data: sellerExists, error: sellerCheckError } = await supabaseClient
        .from('sellers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (sellerCheckError) {
        console.error("Error checking if seller exists:", sellerCheckError);
      }
        
      if (!sellerExists) {
        console.log("Seller record doesn't exist, creating new seller record");
        const { error: sellerCreateError } = await supabaseClient
          .from('sellers')
          .insert({
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            verification_status: 'pending'
          });
          
        if (sellerCreateError) {
          console.error("Error creating seller record:", sellerCreateError);
          throw new Error("Failed to create seller profile");
        }
      } else {
        console.log("Seller record already exists:", sellerExists);
      }
      
      // Try to call the RPC function as a backup to ensure all side effects are triggered
      try {
        const { error: rpcError } = await supabaseClient.rpc('register_seller', {
          p_user_id: userId
        });
        
        if (rpcError) {
          console.warn("RPC register_seller failed but direct updates succeeded:", rpcError);
        } else {
          console.log("RPC register_seller succeeded as backup");
        }
      } catch (rpcError) {
        console.warn("RPC register_seller failed but direct updates succeeded:", rpcError);
      }
      
      // Save profile to cache for offline access
      saveToCache(CACHE_KEYS.USER_PROFILE, {
        id: userId,
        role: 'seller',
        updated_at: new Date().toISOString()
      });
      
      console.log("Seller registration successful");
      toast.success("Seller registration successful!");
      return true;
    } catch (error: any) {
      console.error("Error registering seller:", error);
      
      // Provide more specific error messages based on the error type
      const errorMessage = error.message === 'Failed to update user role' 
        ? "Could not update your account role. Please try again."
        : error.message === 'Failed to create seller profile'
        ? "Could not create your seller profile. Please contact support."
        : "An unexpected error occurred during registration. Please try again.";
        
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    registerSeller
  };
};
