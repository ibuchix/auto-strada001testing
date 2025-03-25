
/**
 * Changes made:
 * - 2024-12-20: Refactored from original useValuationForm into smaller composable hooks
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
    showDialog,
    setShowDialog,
    valuationResult,
    setValuationResult,
    resetState
  } = useValuationState();

  // Error handling
  const { handleError, resetRetryCount } = useValuationErrorHandling();

  // Valuation request handling
  const { executeRequest } = useValuationRequest({
    onSuccess: (result) => {
      setValuationResult(result);
      setShowDialog(true);
      resetRetryCount();
    },
    onError: (error) => {
      handleError(error);
    },
    setIsLoading
  });

  // Form submission handler
  const onSubmit = async (data: ValuationFormData) => {
    await executeRequest(data);
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
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit: form.handleSubmit(onSubmit),
    resetForm,
  };
};
