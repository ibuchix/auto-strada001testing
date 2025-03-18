
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of valuation form
 * - 2024-03-19: Added result dialog integration
 * - 2024-03-19: Implemented form validation
 * - 2024-09-28: Updated to work with modified useValuationForm hook
 * - 2024-09-29: Fixed TypeScript errors and properly initialized form object
 */

import { ValuationInput } from "./ValuationInput";
import { ValuationResult } from "./valuation/components/ValuationResult";
import { Dialog } from "@/components/ui/dialog";
import { useValuationForm } from "@/hooks/useValuationForm";
import { useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { valuationFormSchema, ValuationFormData } from "@/types/validation";

export const ValuationForm = () => {
  const navigate = useNavigate();
  
  // Initialize the form properly with react-hook-form
  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "manual"
    }
  });
  
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

  // Create a wrapper for the submit handler that works with react-hook-form
  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const formData = form.getValues();
    handleVinSubmit(e, formData);
  }, [form, handleVinSubmit]);

  return (
    <div className="w-full max-w-md mx-auto">
      <ValuationInput 
        form={form}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {valuationResult && (
          <ValuationResult 
            valuationResult={{
              make: valuationResult.make || "",
              model: valuationResult.model || "",
              year: valuationResult.year || 0,
              vin: valuationResult.vin || "",
              transmission: valuationResult.transmission || "manual",
              valuation: valuationResult.valuation,
              averagePrice: valuationResult.averagePrice,
              isExisting: valuationResult.isExisting,
              error: valuationResult.error,
              rawResponse: valuationResult.rawResponse,
              noData: valuationResult.noData
            }}
            onContinue={handleContinue}
            onClose={() => setDialogOpen(false)}
          />
        )}
      </Dialog>
    </div>
  );
};
