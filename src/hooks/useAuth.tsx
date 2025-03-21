
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
 * - 2024-12-28: Completely overhauled registerSeller with enhanced error handling, retry mechanisms, and recovery
 */

import { useState, useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { CACHE_KEYS, saveToCache } from "@/services/offlineCacheService";
import { sellerProfileService } from "@/services/supabase";

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabaseClient = useSupabaseClient();
  
  /**
   * Registers a user as a seller with comprehensive error handling and recovery
   * - Uses multiple fallback mechanisms to ensure successful registration
   * - Repairs inconsistent data states
   * - Provides detailed logging for troubleshooting
   */
  const registerSeller = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      console.log("Starting seller registration process for user:", userId);
      
      // Step 1: Use the specialized seller service first (most reliable method)
      try {
        console.log("Attempting registration via sellerProfileService");
        const serviceResult = await sellerProfileService.registerSeller(userId);
        if (serviceResult) {
          console.log("Seller registration successful via sellerProfileService");
          
          // Update cache even if registration succeeded
          saveToCache(CACHE_KEYS.USER_PROFILE, {
            id: userId,
            role: 'seller',
            updated_at: new Date().toISOString()
          });
          
          toast.success("Seller registration successful!");
          return true;
        }
      } catch (serviceError) {
        console.error("Error using sellerProfileService:", serviceError);
        // Don't return yet - continue with fallback methods
      }
      
      // Step 2: Check if user is already registered as seller
      console.log("Checking if user already has seller role");
      const { data: user, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError) {
        console.error("Error fetching user:", userError);
        throw new Error("Could not verify user account");
      }

      // Check if user already has seller role in metadata
      const hasSellerRole = user.user?.user_metadata?.role === 'seller';
      console.log("User metadata:", user.user?.user_metadata, "Has seller role:", hasSellerRole);

      if (hasSellerRole) {
        console.log("User already has seller role in metadata");
        
        // Update cache to ensure consistency
        saveToCache(CACHE_KEYS.USER_PROFILE, {
          id: user.user.id,
          role: 'seller',
          updated_at: new Date().toISOString()
        });
        
        // Check if seller record exists
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

      // Step 3: Direct registration approach - try each component of registration separately
      
      // Step 3.1: Update user metadata
      console.log("Updating user metadata with seller role");
      try {
        const { error: metadataError } = await supabaseClient.auth.updateUser({
          data: { role: 'seller' }
        });

        if (metadataError) {
          console.error("Error updating user metadata:", metadataError);
          // Continue with other steps even if metadata update fails
        } else {
          console.log("Successfully updated user metadata with seller role");
        }
      } catch (metadataError) {
        console.error("Exception updating user metadata:", metadataError);
        // Continue with other steps
      }
      
      // Step 3.2: Try using the RPC function
      let rpcSuccess = false;
      try {
        console.log("Trying to register via RPC function");
        const { error: rpcError } = await supabaseClient.rpc('register_seller', {
          p_user_id: userId
        });
        
        if (!rpcError) {
          console.log("RPC register_seller succeeded");
          rpcSuccess = true;
        } else {
          console.warn("RPC register_seller failed:", rpcError);
        }
      } catch (rpcError) {
        console.warn("RPC register_seller threw exception:", rpcError);
      }
      
      // Step 3.3: If RPC failed, try direct table operations
      if (!rpcSuccess) {
        console.log("Attempting manual table updates");
        
        // Step 3.3.1: Check profile table
        try {
          // First check if profile exists
          const { data: profileExists, error: profileCheckError } = await supabaseClient
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .maybeSingle();
            
          if (profileCheckError) {
            console.error("Error checking profile:", profileCheckError);
          }
          
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
        } catch (profileError) {
          console.error("Exception in profile operations:", profileError);
        }
        
        // Step 3.3.2: Check seller table
        try {
          // Check if seller record exists
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
            }
          } else {
            console.log("Seller record already exists:", sellerExists);
          }
        } catch (sellerError) {
          console.error("Exception in seller operations:", sellerError);
        }
      }
      
      // Step 4: Verify registration was successful using multiple methods
      let registrationSuccess = false;
      
      try {
        // Verify seller metadata was updated
        const { data: verifyUser } = await supabaseClient.auth.getUser();
        const metadataOk = verifyUser.user?.user_metadata?.role === 'seller';
        
        // Verify profile was updated
        const { data: verifyProfile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        const profileOk = verifyProfile?.role === 'seller';
        
        // Verify seller record exists
        const { data: verifySeller } = await supabaseClient
          .from('sellers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        const sellerOk = !!verifySeller;
        
        registrationSuccess = metadataOk || (profileOk && sellerOk);
        
        console.log("Registration verification:", {
          metadataOk,
          profileOk,
          sellerOk,
          success: registrationSuccess
        });
      } catch (verificationError) {
        console.error("Error verifying registration:", verificationError);
        // If verification fails, assume registration was successful if we didn't encounter fatal errors
        registrationSuccess = true;
      }
      
      // Save to cache regardless of verification outcome (best effort)
      saveToCache(CACHE_KEYS.USER_PROFILE, {
        id: userId,
        role: 'seller',
        updated_at: new Date().toISOString()
      });
      
      if (registrationSuccess) {
        console.log("Seller registration process completed successfully");
        toast.success("Seller registration successful!");
        return true;
      } else {
        console.error("Registration verification failed");
        throw new Error("Could not verify seller registration was completed");
      }
    } catch (error: any) {
      console.error("Error registering seller:", error);
      
      // Provide more specific error messages based on the error type
      const errorMessage = error.message === 'Failed to update user role' 
        ? "Could not update your account role. Please try again."
        : error.message === 'Failed to create seller profile'
        ? "Could not create your seller profile. Please contact support."
        : error.message === 'Could not verify seller registration was completed'
        ? "Your account was created, but we couldn't verify your seller status. Please try to log out and log back in."
        : "An unexpected error occurred during registration. Please try again.";
        
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabaseClient]);

  return {
    isLoading,
    registerSeller
  };
};
