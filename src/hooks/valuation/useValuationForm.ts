
/**
 * Changes made:
 * - 2024-12-20: Refactored from original useValuationForm into smaller composable hooks
 * - 2024-04-04: Fixed type imports
 * - 2025-04-06: Fixed property naming to match useValuationState hook
 * - 2025-05-10: Fixed executeRequest implementation to use requestValuation
 * - 2025-04-30: Fixed type definition for onSubmit to match React Hook Form
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { useValuationState } from "./useValuationState";
import { useValuationRequest } from "./useValuationRequest";
import { useValuationErrorHandling } from "./useValuationErrorHandling";
import { UseValuationFormResult } from "./types";

/**
 * Main hook for managing valuation form logic
 */
export const useValuationForm = (): UseValuationFormResult => {
  // Form setup with validation
  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "manual",
    },
  });

  // State management
  const {
    isLoading,
    setIsLoading,
    dialogOpen,
    setDialogOpen,
    valuationResult,
    setValuationResult,
    resetState
  } = useValuationState();

  // Error handling
  const { handleError, resetRetryCount } = useValuationErrorHandling();

  // Valuation request handling
  const { requestValuation } = useValuationRequest();

  // Form submission handler
  const onSubmit = async (data: ValuationFormData) => {
    setIsLoading(true);
    try {
      const result = await requestValuation(
        data.vin, 
        data.mileage, 
        data.gearbox
      );
      
      if (result) {
        setValuationResult(result);
        setDialogOpen(true);
        resetRetryCount();
      }
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Valuation request failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form and state
  const resetForm = () => {
    form.reset();
    resetState();
    cleanupValuationData();
  };

  return {
    form,
    isLoading,
    showDialog: dialogOpen,
    setShowDialog: setDialogOpen,
    valuationResult,
    onSubmit,
    resetForm,
  };
};
