
/**
 * Hook for handling continuation actions after valuation
 * Created: 2025-05-10
 */

import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export function useValuationContinue() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const isLoggedIn = !!session;

  const handleContinue = useCallback((valuationData: any) => {
    // Store in localStorage for use in the form
    localStorage.setItem('valuationData', JSON.stringify(valuationData));
    localStorage.setItem('valuationTimestamp', Date.now().toString());

    if (!isLoggedIn) {
      navigate('/auth');
      toast.info("Please sign in to continue", {
        description: "Create an account or sign in to list your vehicle for auction."
      });
    } else {
      navigate('/sell-my-car?from=valuation');
    }
  }, [navigate, isLoggedIn]);

  return {
    handleContinue,
    isLoggedIn
  };
}
