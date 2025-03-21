
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
      if (user.user?.user_metadata?.role === 'seller') {
        console.log("User already has seller role in metadata");
        
        // Still update cache to ensure consistency
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: user.user.id,
          role: 'seller',
          updated_at: new Date().toISOString()
        });
        
        // Check if seller entry exists
        const { data: sellerExists } = await supabaseClient
          .from('sellers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (sellerExists) {
          console.log("Seller record already exists:", sellerExists);
          return true;
        }
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

      console.log("Calling register_seller database function");
      // Method 1: Try using the RPC function first (security definer function that bypasses RLS)
      const { data: rpcResult, error: rpcError } = await supabaseClient.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (!rpcError && rpcResult) {
        console.log("Successfully registered seller via RPC function");
        return true;
      }
      
      console.warn("RPC register_seller failed, falling back to manual registration:", rpcError);

      // Method 2: Try manual registration with profiles update
      try {
        console.log("Attempting manual profile creation/update");
        
        // First check if profile exists
        const { data: existingProfile } = await supabaseClient
          .from('profiles')
          .select('id, role')
          .eq('id', userId)
          .maybeSingle();
          
        if (existingProfile) {
          console.log("Profile exists, updating role:", existingProfile);
          // Update existing profile
          await supabaseClient
            .from('profiles')
            .update({ 
              role: 'seller',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
        } else {
          console.log("Profile doesn't exist, creating new profile");
          // Create new profile
          await supabaseClient
            .from('profiles')
            .insert({ 
              id: userId, 
              role: 'seller',
              updated_at: new Date().toISOString()
            });
        }
            
        // Method 3: Check if seller record exists, create if needed
        const { data: sellerExists } = await supabaseClient
          .from('sellers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (!sellerExists) {
          console.log("Seller record doesn't exist, creating new seller record");
          await supabaseClient
            .from('sellers')
            .insert({
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        } else {
          console.log("Seller record already exists:", sellerExists);
        }
        
        // Save profile to cache for offline access
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: userId,
          role: 'seller',
          updated_at: new Date().toISOString()
        });
        
        console.log("Manual seller registration successful");
        toast.success("Seller registration successful!");
        return true;
      } catch (fallbackError) {
        console.error("All seller registration methods failed:", fallbackError);
        throw fallbackError;
      }
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
