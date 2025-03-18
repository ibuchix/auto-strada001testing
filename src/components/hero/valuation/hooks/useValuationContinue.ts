
/**
 * Changes made:
 * - 2024-03-19: Created useValuationContinue hook extracted from ValuationResult
 * - 2024-09-27: Added SafeNavigate component to ensure router context
 */

import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RouterGuard } from "@/components/RouterGuard";

interface ValuationResultData {
  noData?: boolean;
  vin: string;
  transmission: string;
}

// A component that safely uses the navigate hook
export const SafeNavigate = ({ 
  path, 
  state,
  message,
  description,
  onNavigate 
}: { 
  path: string, 
  state?: any,
  message?: string,
  description?: string,
  onNavigate?: () => void
}) => {
  const navigate = useNavigate();
  
  const performNavigation = () => {
    if (message) {
      toast.info(message, { description });
    }
    
    navigate(path, state ? { state } : undefined);
    if (onNavigate) onNavigate();
  };
  
  return <button onClick={performNavigation} style={{ display: 'none' }} />;
};

export const useValuationContinue = () => {
  const { session } = useAuth();

  const handleContinue = async (valuationResult: ValuationResultData) => {
    if (!session) {
      // Navigation and toast will be handled by the SafeNavigate component
      return {
        path: '/auth',
        message: "Please sign in to list your car",
        description: "Create an account or sign in to continue.",
      };
    }

    // Check user's role from the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error) {
      toast.error("Failed to verify user role");
      return null;
    }

    if (profile.role !== 'seller') {
      return {
        path: '/auth',
        message: "Please sign up as a seller",
        description: "You need a seller account to list your car.",
      };
    }

    const mileage = parseInt(localStorage.getItem('tempMileage') || '0');

    // If they are a seller, handle the navigation based on data availability
    if (valuationResult.noData) {
      return {
        path: '/manual-valuation',
        message: "Manual valuation required",
        description: "Please provide additional details about your vehicle.",
        onNavigate: () => {
          // No localStorage updates needed for manual valuation
        }
      };
    } else {
      return {
        path: '/sell-my-car',
        onNavigate: () => {
          localStorage.setItem('valuationData', JSON.stringify(valuationResult));
          localStorage.setItem('tempVIN', valuationResult.vin);
          localStorage.setItem('tempMileage', mileage.toString());
          localStorage.setItem('tempGearbox', valuationResult.transmission);
        }
      };
    }
  };

  return {
    handleContinue,
    isLoggedIn: !!session,
    SafeNavigate
  };
};
