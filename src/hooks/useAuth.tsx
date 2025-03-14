
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
      
      // Update user metadata to include role
      const { error: metadataError } = await supabaseClient.auth.updateUser({
        data: { role: 'seller' }
      });

      if (metadataError) throw metadataError;

      // Use the register_seller database function to ensure both profile and seller entries are created
      const { data, error } = await supabaseClient.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (error) throw error;

      if (!data) {
        throw new Error("Failed to register seller profile");
      }

      toast.success("Seller registration successful!");
      return true;
    } catch (error: any) {
      console.error("Error registering seller:", error);
      toast.error(error.message || "Failed to register seller");
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
