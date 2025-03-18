
/**
 * Changes made:
 * - 2024-03-19: Created useValuationContinue hook extracted from ValuationResult
 * - 2024-09-27: Added SafeNavigate component to ensure router context
 * - 2024-09-27: Fixed syntax errors in SafeNavigate implementation
 * - 2024-09-28: Converted the SafeNavigate component to a function to avoid JSX in .ts files
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

// Interface for SafeNavigate properties
interface SafeNavigateProps { 
  path: string;
  state?: any;
  message?: string;
  description?: string;
  onNavigate?: () => void;
}

// Function to create a navigation handler
const createSafeNavigationHandler = (props: SafeNavigateProps, navigate: ReturnType<typeof useNavigate>) => {
  return () => {
    if (props.message) {
      toast.info(props.message, { description: props.description });
    }
    
    navigate(props.path, props.state ? { state: props.state } : undefined);
    if (props.onNavigate) props.onNavigate();
  };
};

export const useValuationContinue = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  // A function that returns a navigation handler
  const getSafeNavigate = (props: SafeNavigateProps) => {
    return createSafeNavigationHandler(props, navigate);
  };

  const handleContinue = async (valuationResult: ValuationResultData) => {
    if (!session) {
      // Return navigation configuration
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
    getSafeNavigate // Provide the function that creates a navigation handler
  };
};
