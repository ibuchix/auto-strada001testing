
/**
 * Enhanced valuation form hook
 * Created: 2025-04-23
 * This hook properly manages form state to avoid React queue errors
 * Updated: 2025-04-29 - Fixed state handling to ensure dialog displays with results
 * Updated: 2025-05-25 - Fixed onSubmit handler to use proper type signature
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { useValuationErrorDialog } from "./useValuationErrorDialog";
import { getValuation, cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SubmitHandler } from "react-hook-form";

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

  // Form submission handler with proper typing for React Hook Form
  const handleFormSubmit: SubmitHandler<ValuationFormData> = useCallback(async (data: ValuationFormData) => {
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
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        
        // Ensure we show the dialog AFTER setting the result
        setTimeout(() => {
          setShowDialog(true);
          console.log("Dialog should be visible now");
        }, 100);
      } else {
        // Handle error case
        const errorMessage = result.error || "Failed to get valuation";
        toast.error(errorMessage);
        setValuationResult({
          error: errorMessage,
          vin: data.vin,
          transmission: data.gearbox
        });
        
        // Show error dialog
        setTimeout(() => {
          setShowDialog(true);
          console.log("Error dialog should be visible now");
        }, 100);
      }
    } catch (error: any) {
      console.error("Valuation error:", error);
      toast.error(error.message || "An error occurred");
      setValuationResult({
        error: error.message || "An unexpected error occurred",
        vin: data.vin,
        transmission: data.gearbox
      });
      
      // Show error dialog
      setTimeout(() => {
        setShowDialog(true);
        console.log("Exception dialog should be visible now");
      }, 100);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handler for continuing to car listing
  const handleContinue = useCallback(() => {
    console.log("Continue to listing triggered");
    setShowDialog(false);
    navigate('/sell-my-car?from=valuation');
  }, [navigate]);

  // Reset form state
  const resetForm = useCallback(() => {
    form.reset();
    setValuationResult(null);
    setShowDialog(false);
    cleanupValuationData();
    console.log("Form reset complete");
  }, [form]);

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    errorDialogOpen,
    setErrorDialogOpen,
    valuationResult,
    handleFormSubmit, // Use the properly typed handler now
    handleContinue,
    resetForm
  };
};
