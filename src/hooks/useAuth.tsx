
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
 */

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabaseClient = useSupabaseClient();
  
  const registerSeller = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // First check if the user already has a role
      const { data: user, error: userError } = await supabaseClient.auth.getUser(userId);
      
      if (userError) {
        console.error("Error fetching user:", userError);
        throw new Error("Could not verify user account");
      }

      // Check if user already has seller role
      if (user.user?.user_metadata?.role === 'seller') {
        toast.error("This account is already registered as a seller");
        return false;
      }

      // Update user metadata to include role
      const { error: metadataError } = await supabaseClient.auth.updateUser({
        data: { role: 'seller' }
      });

      if (metadataError) {
        console.error("Error updating user metadata:", metadataError);
        throw new Error("Failed to update user role");
      }

      // Use the register_seller database function to ensure both profile and seller entries are created
      const { data, error } = await supabaseClient.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (error) {
        console.error("Error registering seller:", error);
        throw new Error(error.message || "Failed to complete seller registration");
      }

      if (!data) {
        throw new Error("Failed to create seller profile");
      }

      toast.success("Seller registration successful! Redirecting to dashboard...");
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
