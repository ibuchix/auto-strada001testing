
/**
 * Enhanced valuation form hook with better error handling
 * Created: 2025-04-15
 * Updated: 2025-04-19 - Fixed improper error detection causing valid VINs to show manual valuation
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { useValuationStore } from "@/hooks/store/useValuationStore";
import { normalizeVIN } from "@/utils/vinValidation";
import { toast } from "sonner";

export const useEnhancedValuationForm = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const {
    vin,
    mileage,
    gearbox,
    isLoading,
    valuationResult,
    setVin,
    setMileage,
    setGearbox,
    handleVinSubmit,
    resetForm
  } = useValuationStore();

  // Setup form with validation
  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: vin || "",
      mileage: mileage || "",
      gearbox: gearbox || "manual",
    },
  });

  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    console.log("Enhanced valuation form submitting with data:", {
      vin: form.getValues('vin'),
      mileage: form.getValues('mileage'),
      gearbox: form.getValues('gearbox')
    });
    
    // Store input in state
    setVin(form.getValues('vin'));
    setMileage(form.getValues('mileage'));
    setGearbox(form.getValues('gearbox'));
    
    // Submit the form
    handleVinSubmit(e, {
      vin: normalizeVIN(form.getValues('vin')),
      mileage: form.getValues('mileage'),
      gearbox: form.getValues('gearbox')
    });
    
    // Open dialog
    setShowDialog(true);
  };

  // Continue with car listing
  const handleContinue = useCallback(() => {
    console.log("Continuing with car listing");
    if (valuationResult && valuationResult.make) {
      window.location.href = "/sell-my-car";
    } else {
      toast.error("No valid vehicle data available");
    }
  }, [valuationResult]);

  // Close dialog
  const handleClose = useCallback(() => {
    console.log("Closing valuation dialog");
    setShowDialog(false);
    setErrorDialogOpen(false);
  }, []);

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    errorDialogOpen,
    setErrorDialogOpen,
    valuationResult,
    onSubmit,
    handleContinue,
    handleClose,
    resetForm
  };
};
