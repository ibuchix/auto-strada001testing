
/**
 * Hook for handling the continuation flow after valuation
 * Created: 2025-05-10
 */

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useValuationContinue() {
  const navigate = useNavigate();
  const isLoggedIn = !!supabase.auth.getSession;

  const handleContinue = useCallback((valuationData: any) => {
    // Store data in localStorage for the next step
    if (valuationData) {
      localStorage.setItem('valuationData', JSON.stringify(valuationData));
    }
    
    // Navigate based on auth status
    if (isLoggedIn) {
      navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData 
        } 
      });
    } else {
      toast.info("Please sign in to continue", {
        description: "Create an account or sign in to proceed with listing your vehicle."
      });
      navigate('/auth', {
        state: {
          from: 'valuation',
          returnTo: '/sell-my-car'
        }
      });
    }
  }, [navigate, isLoggedIn]);

  return {
    isLoggedIn,
    handleContinue
  };
}
