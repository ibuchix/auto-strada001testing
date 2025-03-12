
/**
 * Changes made:
 * - 2024-03-28: Created useAuth hook to handle authentication logic
 * - 2024-03-29: Updated type definitions to ensure consistency with form data
 * - 2024-03-31: Fixed DealerData type to make all fields required
 * - 2024-04-01: Fixed type mismatch between DealerData and form submission
 * - 2024-06-24: Added registerSeller function for seller registration
 * - 2024-06-25: Fixed registerSeller implementation to properly update user role
 */

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

export type DealerData = {
  dealershipName: string;
  licenseNumber: string;
  supervisorName: string;
  taxId: string;
  businessRegNumber: string;
  address: string;
};

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabaseClient = useSupabaseClient();

  const registerDealer = async (userId: string, dealerData: DealerData) => {
    try {
      setIsLoading(true);
      const { error } = await supabaseClient
        .from('dealers')
        .insert({
          user_id: userId,
          dealership_name: dealerData.dealershipName,
          license_number: dealerData.licenseNumber,
          supervisor_name: dealerData.supervisorName,
          tax_id: dealerData.taxId,
          business_registry_number: dealerData.businessRegNumber,
          address: dealerData.address
        });

      if (error) throw error;

      // Update user metadata to include role
      const { error: updateError } = await supabaseClient.auth.updateUser({
        data: { role: 'dealer' }
      });

      if (updateError) throw updateError;

      toast.success("Dealer registration successful!");
      return true;
    } catch (error: any) {
      console.error("Error registering dealer:", error);
      toast.error(error.message || "Failed to register dealer");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const registerSeller = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Update user metadata to include role
      const { error } = await supabaseClient.auth.updateUser({
        data: { role: 'seller' }
      });

      if (error) throw error;

      // Create seller profile record if needed
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .upsert({ 
          id: userId,
          role: 'seller' 
        });

      if (profileError) throw profileError;

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

  const signInWithGoogle = async (redirectUrl: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        toast.error(error.message);
        return false;
      }
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    registerDealer,
    registerSeller,
    signInWithGoogle
  };
};
