
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation form
 * - 2024-03-19: Added result dialog integration
 * - 2024-03-19: Implemented form validation
 * - 2024-09-28: Updated to work with modified useValuationForm hook
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./valuation/components/ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useValuationForm } from "@/hooks/useValuationForm";
import { useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";

export const ValuationForm = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    dialogOpen,
    setDialogOpen,
    valuationResult,
    handleVinSubmit,
    getNavigationHandler
  } = useValuationForm('home');

  // Create a function that will use the navigation handler
  const handleContinue = useCallback(() => {
    const navigationHandler = getNavigationHandler(navigate, () => {
      // Any additional logic after navigation
      console.log("Navigation completed");
    });
    navigationHandler();
  }, [navigate, getNavigationHandler]);

  // Component that uses the form
  const form = {
    // Add form properties here if needed
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        form={form}
        isLoading={isLoading}
        onSubmit={handleVinSubmit}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {valuationResult && (
          <ValuationResult 
            valuationResult={valuationResult}
            onContinue={handleContinue}
            onClose={() => setDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
};
