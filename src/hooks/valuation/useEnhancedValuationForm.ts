
/**
 * Enhanced valuation form hook
 * Created: 2025-04-23
 * This hook properly manages form state to avoid React queue errors
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { useValuationErrorDialog } from "./useValuationErrorDialog";
import { getValuation, cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useEnhancedValuationForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  
  // Properly initialize dialog state
  const { 
    isOpen: errorDialogOpen, 
    setIsOpen: setErrorDialogOpen 
  } = useValuationErrorDialog();

  // Setup form with validation
  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "manual",
    },
  });

  // Form submission handler with safety checks
  const onSubmit = useCallback(async (data: ValuationFormData) => {
    console.log("Form submission with data:", data);
    setIsLoading(true);
    
    try {
      const mileage = parseInt(data.mileage) || 0;
      
      // Store in localStorage for possible retrieval later
      localStorage.setItem("tempMileage", data.mileage);
      localStorage.setItem("tempVIN", data.vin);
      localStorage.setItem("tempGearbox", data.gearbox);
      
      const result = await getValuation(
        data.vin,
        mileage,
        data.gearbox
      );
      
      console.log("Valuation result:", result);
      
      if (result.success && result.data) {
        // Store the full result
        setValuationResult(result.data);
        setShowDialog(true);
        localStorage.setItem("valuationData", JSON.stringify(result.data));
      } else {
        // Handle error case
        const errorMessage = result.data?.error || "Failed to get valuation";
        toast.error(errorMessage);
        setValuationResult({
          error: errorMessage,
          vin: data.vin,
          transmission: data.gearbox
        });
        setShowDialog(true);
      }
    } catch (error: any) {
      console.error("Valuation error:", error);
      toast.error(error.message || "An error occurred");
      setValuationResult({
        error: error.message || "An unexpected error occurred",
        vin: data.vin,
        transmission: data.gearbox
      });
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler for continuing to car listing
  const handleContinue = useCallback(() => {
    setShowDialog(false);
    navigate('/sell-my-car?from=valuation');
  }, [navigate]);

  // Reset form state
  const resetForm = useCallback(() => {
    form.reset();
    setValuationResult(null);
    setShowDialog(false);
    cleanupValuationData();
  }, [form]);

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    errorDialogOpen,
    setErrorDialogOpen,
    valuationResult,
    onSubmit: form.handleSubmit(onSubmit),
    handleContinue,
    resetForm
  };
};
