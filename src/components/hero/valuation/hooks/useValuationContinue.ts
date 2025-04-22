
/**
 * Changes made:
 * - 2025-04-22: Removed localStorage operations to debug nested API data issues
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export const useValuationContinue = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const isLoggedIn = !!session;

  const handleContinue = (carData: any) => {
    console.log('Continue button clicked with data:', carData);

    if (!isLoggedIn) {
      toast.info("Please sign in to continue", {
        description: "Create an account or sign in to list your car",
        duration: 5000
      });
      navigate('/auth', { 
        state: { 
          redirectAfter: '/sell-my-car',
          carData
        }
      });
      return;
    }

    // Navigate to the sell-my-car page with state
    navigate('/sell-my-car', { 
      state: { 
        fromValuation: true,
        valuationData: carData
      }
    });

    toast.success("Ready to list your car", {
      description: "Please complete the listing form",
      duration: 3000
    });
  };

  return { 
    handleContinue, 
    isLoggedIn 
  };
};
