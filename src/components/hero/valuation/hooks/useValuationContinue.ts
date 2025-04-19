
/**
 * Hook for handling valuation continuation logic
 * Created: 2025-04-19
 */

import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ValuationResultData {
  vin?: string;
  transmission?: string;
  noData?: boolean;
  [key: string]: any;
}

export const useValuationContinue = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const handleContinue = async (valuationResult: ValuationResultData) => {
    if (!session) {
      navigate('/auth');
      toast.info("Please sign in to list your car", {
        description: "Create an account or sign in to continue.",
      });
      return;
    }

    // Check user's role from the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      toast.error("Failed to verify user role");
      return;
    }

    if (profile.role !== 'seller') {
      navigate('/auth');
      toast.info("Please sign up as a seller", {
        description: "You need a seller account to list your car.",
      });
      return;
    }

    const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

    // If they are a seller, handle the navigation based on data availability
    if (valuationResult.noData) {
      navigate('/manual-valuation');
      toast.info("Manual valuation required", {
        description: "Please provide additional details about your vehicle.",
      });
    } else {
      navigate('/sell-my-car');
      localStorage.setItem('valuationData', JSON.stringify(valuationResult));
      
      // Store VIN and transmission if available
      if (valuationResult.vin) {
        localStorage.setItem('tempVIN', valuationResult.vin);
      }
      
      localStorage.setItem('tempMileage', mileage.toString());
      
      if (valuationResult.transmission) {
        localStorage.setItem('tempGearbox', valuationResult.transmission);
      }
    }
  };

  return {
    handleContinue,
    isLoggedIn: !!session
  };
};
