
/**
 * Changes made:
 * - 2024-03-28: Created useAuth hook to handle authentication logic
 */

import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabaseClient = useSupabaseClient();

  const registerDealer = async (userId: string, dealerData: {
    dealershipName: string;
    licenseNumber: string;
    supervisorName: string;
    taxId: string;
    businessRegNumber: string;
    address: string;
  }) => {
    try {
      const { error } = await supabaseClient
        .from('dealers')
        .insert({
          user_id: userId,
          dealership_name: dealerData.dealershipName,
          license_number: dealerData.licenseNumber,
          supervisor_name: dealerData.supervisorName,
          tax_id: dealerData.taxId,
          business_registry_number: dealerData.businessRegNumber,
          address: dealerData.address || 'N/A'
        });

      if (error) throw error;

      toast.success("Dealer registration successful!");
      return true;
    } catch (error: any) {
      console.error("Error registering dealer:", error);
      toast.error(error.message || "Failed to register dealer");
      return false;
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
    signInWithGoogle
  };
};
