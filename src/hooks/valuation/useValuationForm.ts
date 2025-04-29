
/**
 * Main valuation form hook - coordinates other hooks
 * Updated: 2025-05-10 - Refactored to use smaller hooks
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { useValuationState } from "./useValuationState";
import { useValuationRequest } from "./useValuationRequest";
import { useValuationErrorHandling } from "./useValuationErrorHandling";
import { useRealtime } from "@/components/RealtimeProvider";
import { useEffect } from "react";
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

  // Realtime connection status
  const { isConnected } = useRealtime();

  // State management
  const {
    isLoading,
    setIsLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    setValuationResult,
    resetState,
    resetRetryCount
  } = useValuationState();

  // Error handling
  const { handleError } = useValuationErrorHandling();

  // Valuation request handling
  const { executeRequest, cleanup: cleanupRequest, requestId } = useValuationRequest();

  // Log initial setup for debugging
  useEffect(() => {
    console.log(`[ValuationForm][${requestId}] Initialized:`, {
      isConnected,
      timestamp: new Date().toISOString()
    });
    
    return () => {
      console.log(`[ValuationForm][${requestId}] Unmounting`);
      cleanupValuationData();
      cleanupRequest();
    };
  }, [isConnected, requestId, cleanupRequest]);

  // Form submission handler
  const onSubmit = async (data: ValuationFormData) => {
    setIsLoading(true);
    
    try {
      const result = await executeRequest(
        data.vin, 
        data.mileage, 
        data.gearbox
      );
      
      if (result.success && result.data) {
        // Verify minimum data presence
        if (!result.data.make && !result.data.model) {
          console.warn(`[ValuationForm][${requestId}] Missing critical data in response:`, {
            dataFields: Object.keys(result.data),
            timestamp: new Date().toISOString()
          });
          
          // Handle as a "no data found" error
          setValuationResult({
            noData: true,
            error: "No data found for this VIN",
            vin: data.vin,
            transmission: data.gearbox
          });
          setShowDialog(true);
          return;
        }
      
        // Set the result with normalized property names
        const normalizedResult = {
          ...result.data,
          reservePrice: result.data.reservePrice || result.data.valuation,
          valuation: result.data.valuation || result.data.reservePrice,
          vin: data.vin
        };
        
        setValuationResult(normalizedResult);
        setShowDialog(true);
        resetRetryCount();
      } else {
        // Extract error message safely
        let errorMessage = result.error || "Valuation failed";
        
        if (result.data && typeof result.data === 'object' && 'error' in result.data) {
          errorMessage = result.data.error;
        }
        
        console.error(`[ValuationForm][${requestId}] Valuation failed:`, {
          error: errorMessage,
          timestamp: new Date().toISOString()
        });
        
        // Set error result for dialog display
        setValuationResult({
          error: errorMessage,
          noData: errorMessage.includes("No data"),
          vin: data.vin,
          transmission: data.gearbox
        });
        setShowDialog(true);
        handleError(errorMessage);
      }
    } catch (error: any) {
      console.error(`[ValuationForm][${requestId}] Valuation error:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Set error result for dialog display
      setValuationResult({
        error: error.message || "Failed to get vehicle valuation",
        noData: error.message?.includes("No data"),
        vin: data.vin,
        transmission: data.gearbox
      });
      setShowDialog(true);
      handleError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form and state
  const resetForm = () => {
    form.reset();
    resetState();
    cleanupValuationData();
    
    console.log(`[ValuationForm][${requestId}] Form reset`, {
      timestamp: new Date().toISOString()
    });
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
