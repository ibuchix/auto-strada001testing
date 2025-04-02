
/**
 * Changes made:
 * - 2024-04-02: Fixed incomplete hook implementation that was causing React Error #310 (infinite loop)
 * - 2024-04-02: Added proper dependency arrays to useEffect hooks
 * - 2024-04-02: Fixed return statement to include all required properties
 */

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValuationFormData, valuationFormSchema } from "@/types/validation";
import { toast } from "sonner";
import { getValuation, cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { useRealtime } from "@/components/RealtimeProvider";

export const useValuationForm = (context: 'home' | 'seller' = 'home') => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [valuationResult, setValuationResult] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isConnected } = useRealtime();
  
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
    console.log('Starting valuation form submission:', data);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    // Set a timeout to cancel the operation if it takes too long
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      toast.error("Request timed out", {
        description: "The valuation request is taking longer than expected. Please try again.",
      });
    }, 20000); // 20 second timeout
    
    try {
      // Parse mileage to ensure it's a number
      const mileage = parseInt(data.mileage) || 0;
      
      console.log('Calling getValuation with parameters:', {
        vin: data.vin,
        mileage,
        gearbox: data.gearbox
      });
      
      const result = await getValuation(
        data.vin,
        mileage,
        data.gearbox,
        context
      );

      console.log('Valuation result:', result);

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (result.success) {
        // Store the valuation data in localStorage
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        localStorage.setItem("tempMileage", data.mileage);
        localStorage.setItem("tempVIN", data.vin);
        localStorage.setItem("tempGearbox", data.gearbox);

        // Set the result with normalized property names
        const normalizedResult = {
          ...result.data,
          reservePrice: result.data.reservePrice || result.data.valuation,
          valuation: result.data.valuation || result.data.reservePrice
        };
        
        setValuationResult(normalizedResult);
        setShowDialog(true);
        setRetryCount(0); // Reset retry counter on success
      } else {
        handleError(result.data?.error);
      }
    } catch (error: any) {
      console.error("Valuation error:", error);
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      handleError(error.message || "Failed to get vehicle valuation");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle errors with detailed feedback
  const handleError = (errorMessage?: string) => {
    console.error('Valuation failed:', errorMessage);
    
    // Handle specific error scenarios
    if (errorMessage?.includes('rate limit') || errorMessage?.includes('too many requests')) {
      toast.error("Too many requests", {
        description: "Please wait a moment before trying again.",
      });
    } else if (errorMessage === 'Request timed out') {
      // Timeout was already handled
    } else if (errorMessage?.includes('WebSocket') || errorMessage?.includes('connection')) {
      toast.error("Connection issue detected", {
        description: "Please check your internet connection and try again.",
      });
    } else {
      toast.error(errorMessage || "Failed to get vehicle valuation", {
        description: "Please try again or contact support if the issue persists."
      });
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Reset form and state
  const resetForm = () => {
    form.reset();
    setValuationResult(null);
    setShowDialog(false);
    setIsLoading(false);
    setRetryCount(0);
    cleanupValuationData();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return {
    form,
    isLoading,
    showDialog,
    setShowDialog,
    valuationResult,
    onSubmit: form.handleSubmit(handleSubmit),
    resetForm,
    retryCount,
    resetRetryCount: () => setRetryCount(0),
  };
};
