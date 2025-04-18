
/**
 * Enhanced Valuation Form Hook
 * Created: 2025-04-18
 * Changes:
 * - 2025-04-19: Improved error handling and state management
 * - 2025-04-22: Enhanced data handling and debugging to ensure all fields are displayed
 */

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { toast } from "sonner";
import { getValuation, cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { useNavigate } from "react-router-dom";
import { useValuationErrorDialog } from "./useValuationErrorDialog";

export const useEnhancedValuationForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  
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

  // Handle form submission
  const handleSubmit = async (data: ValuationFormData) => {
    console.log("Starting valuation submission with data:", data);
    setIsLoading(true);

    try {
      // Parse mileage to ensure it's a number
      const mileage = parseInt(data.mileage) || 0;
      
      // Store values in localStorage for later use
      localStorage.setItem("tempMileage", data.mileage);
      localStorage.setItem("tempVIN", data.vin);
      localStorage.setItem("tempGearbox", data.gearbox);
      
      console.log("Calling valuation service with:", {
        vin: data.vin,
        mileage,
        gearbox: data.gearbox
      });
      
      const result = await getValuation(
        data.vin,
        mileage,
        data.gearbox
      );

      console.log("Valuation API response:", result);

      if (result.success) {
        // Even if success is true, check if we have proper data
        if (!result.data || 
            (!result.data.make && !result.data.model && 
             (!result.data.reservePrice || result.data.reservePrice <= 0))) {
          
          console.error("API indicated success but returned incomplete data:", result.data);
          
          // Create error result for display
          setValuationResult({
            success: false,
            data: {
              error: "Incomplete data received from valuation service",
              noData: true,
              vin: data.vin,
              transmission: data.gearbox
            }
          });
        } else {
          // Log success with the data we received
          console.log("Successful valuation with data:", result.data);
          
          // Normalize the result data structure
          const normalizedResult = {
            success: true,
            data: {
              ...result.data,
              vin: data.vin,
              transmission: data.gearbox,
              // Ensure both property names exist for compatibility
              reservePrice: result.data.reservePrice || result.data.valuation,
              valuation: result.data.valuation || result.data.reservePrice
            }
          };
          
          console.log("Setting normalized valuation result:", normalizedResult);
          setValuationResult(normalizedResult);
          
          // Store the full valuation data in localStorage
          localStorage.setItem("valuationData", JSON.stringify(normalizedResult.data));
        }
        
        // Show the dialog in both cases (success with data or success with incomplete data)
        setShowDialog(true);
      } else {
        // API returned an explicit error
        console.error("Valuation API returned error:", result.error);
        
        setValuationResult({
          success: false,
          data: {
            error: result.error || "Failed to get vehicle valuation",
            noData: !result.data || result.error?.includes("No data"),
            vin: data.vin,
            transmission: data.gearbox
          }
        });
        
        setShowDialog(true);
      }
    } catch (error: any) {
      console.error("Unexpected error during valuation:", error);
      
      setValuationResult({
        success: false,
        data: {
          error: error.message || "An unexpected error occurred",
          noData: true,
          vin: data.vin,
          transmission: data.gearbox
        }
      });
      
      setShowDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Continue to car listing flow
  const handleContinue = useCallback(() => {
    navigate("/sell-my-car?from=valuation");
  }, [navigate]);

  // Reset form and state
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
    onSubmit: form.handleSubmit(handleSubmit),
    handleContinue,
    resetForm,
    retryCount,
    setRetryCount
  };
};
