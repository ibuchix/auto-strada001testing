
/**
 * Changes made:
 * - Implemented a more consistent use of React Hook Form
 * - Added improved form state management with validation
 * - Optimized for better performance with memoization
 * - Integrated with useFormWithValidation for consistent patterns
 * - 2025-04-06: Fixed property naming to match useValuationState hook
 */

import { useState, useCallback } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useFormWithValidation } from "../forms/useFormWithValidation";
import { cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { useValuationState } from "./useValuationState";
import { useValuationRequest } from "./useValuationRequest";
import { useValuationErrorHandling } from "./useValuationErrorHandling";

// Define the schema using zod for validation
const valuationFormSchema = z.object({
  vin: z.string()
    .min(17, { message: "VIN must be 17 characters" })
    .max(17, { message: "VIN must be 17 characters" }),
  mileage: z.string()
    .min(1, { message: "Mileage is required" })
    .refine((val) => !isNaN(Number(val)), { 
      message: "Mileage must be a number" 
    }),
  gearbox: z.enum(["manual", "automatic"]),
});

export type ValuationFormData = z.infer<typeof valuationFormSchema>;

export function useEnhancedValuationForm(context: 'home' | 'seller' = 'home') {
  const navigate = useNavigate();
  
  // Use the state management hook
  const {
    isLoading,
    setIsLoading,
    dialogOpen, // Fixed: using dialogOpen instead of showDialog
    setDialogOpen, // Fixed: using setDialogOpen instead of setShowDialog
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
      setDialogOpen(true); // Fixed: using setDialogOpen
      resetRetryCount();
    },
    onError: handleError,
    setIsLoading
  });

  // Use our enhanced form hook with validation
  const form = useFormWithValidation({
    schema: valuationFormSchema,
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "manual",
    },
    onSubmit: async (data) => {
      await executeRequest(data);
    },
    onError: (errors) => {
      console.error("Validation errors:", errors);
    },
    persistenceOptions: {
      key: "valuation_form_data",
      shouldPersist: true,
      excludeFields: ["vin"] // Don't persist sensitive data like VIN
    },
    formOptions: {
      mode: "onBlur" // Validate on blur for better UX
    }
  });

  // Handle continue action (e.g., after successful valuation)
  const handleContinue = useCallback(() => {
    setDialogOpen(false); // Fixed: using setDialogOpen
    if (context === 'seller') {
      navigate('/sell-my-car', { 
        state: { 
          fromValuation: true,
          valuationData: valuationResult 
        } 
      });
    }
  }, [context, navigate, valuationResult, setDialogOpen]);

  // Reset form and state
  const resetForm = useCallback(() => {
    form.reset();
    resetState();
    cleanupValuationData();
  }, [form, resetState]);

  return {
    form,
    isLoading,
    showDialog: dialogOpen, // Fixed: mapping dialogOpen to showDialog for API consistency
    setShowDialog: setDialogOpen, // Fixed: mapping setDialogOpen to setShowDialog
    valuationResult,
    onSubmit: form.handleSubmitWithFeedback,
    handleContinue,
    resetForm,
  };
}
