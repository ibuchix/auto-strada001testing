
/**
 * Changes made:
 * - 2024-04-02: Fixed incomplete hook implementation that was causing React Error #310 (infinite loop)
 * - 2024-04-02: Added proper dependency arrays to useEffect hooks
 * - 2024-04-02: Fixed return statement to include all required properties
 * - 2024-04-03: Fixed TypeScript errors by removing unnecessary context parameter
 * - 2024-04-03: Enhanced logging with timestamps and detailed execution information
 * - 2024-04-04: Fixed error property access
 * - 2024-04-04: Added safe error handling with optional chaining
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
  const requestIdRef = useRef<string>(Math.random().toString(36).substring(2, 10));
  
  // Setup form with validation
  const form = useForm<ValuationFormData>({
    resolver: zodResolver(valuationFormSchema),
    defaultValues: {
      vin: "",
      mileage: "",
      gearbox: "manual",
    },
  });
  
  // Log initial setup for debugging
  useEffect(() => {
    console.log(`[ValuationForm][${requestIdRef.current}] Initialized with context:`, {
      context,
      isConnected,
      timestamp: new Date().toISOString()
    });
    
    return () => {
      console.log(`[ValuationForm][${requestIdRef.current}] Unmounting`);
      cleanupValuationData();
    };
  }, [context, isConnected]);
  
  // Handle form submission
  const handleSubmit = async (data: ValuationFormData) => {
    const startTime = performance.now();
    console.log(`[ValuationForm][${requestIdRef.current}] Starting valuation form submission:`, {
      vin: data.vin,
      mileage: data.mileage,
      gearbox: data.gearbox,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    // Set a timeout to cancel the operation if it takes too long
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      console.warn(`[ValuationForm][${requestIdRef.current}] Request timed out after 20 seconds`);
      toast.error("Request timed out", {
        description: "The valuation request is taking longer than expected. Please try again.",
      });
    }, 20000); // 20 second timeout
    
    try {
      // Parse mileage to ensure it's a number
      const mileage = parseInt(data.mileage) || 0;
      
      console.log(`[ValuationForm][${requestIdRef.current}] Calling getValuation with parameters:`, {
        vin: data.vin,
        mileage,
        gearbox: data.gearbox,
        timestamp: new Date().toISOString()
      });
      
      const result = await getValuation(
        data.vin,
        mileage,
        data.gearbox
      );

      console.log(`[ValuationForm][${requestIdRef.current}] Valuation result:`, {
        success: result.success,
        errorPresent: result.data && 'error' in result.data,
        dataSize: result.data ? JSON.stringify(result.data).length : 0,
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });

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
        localStorage.setItem("valuationTimestamp", new Date().toISOString());

        // Log successful result with key data points
        console.log(`[ValuationForm][${requestIdRef.current}] Successful valuation:`, {
          make: result.data.make,
          model: result.data.model,
          year: result.data.year,
          valuation: result.data.valuation || result.data.reservePrice,
          reservePrice: result.data.reservePrice || result.data.valuation,
          totalTime: `${(performance.now() - startTime).toFixed(2)}ms`,
          timestamp: new Date().toISOString()
        });

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
        // Check if error exists in the data object using safe property access
        const errorMessage = result.data && typeof result.data === 'object' && 'error' in result.data
          ? result.data.error
          : 'Valuation failed';
          
        console.error(`[ValuationForm][${requestIdRef.current}] Valuation failed:`, {
          error: errorMessage,
          timestamp: new Date().toISOString()
        });
        
        handleError(errorMessage);
      }
    } catch (error: any) {
      console.error(`[ValuationForm][${requestIdRef.current}] Valuation error:`, {
        message: error.message,
        stack: error.stack,
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      handleError(error.message || "Failed to get vehicle valuation");
    } finally {
      const totalDuration = performance.now() - startTime;
      console.log(`[ValuationForm][${requestIdRef.current}] Request completed in ${totalDuration.toFixed(2)}ms`);
      setIsLoading(false);
    }
  };

  // Handle errors with detailed feedback
  const handleError = (errorMessage?: string) => {
    console.error(`[ValuationForm][${requestIdRef.current}] Valuation failed:`, {
      error: errorMessage,
      retryCount,
      timestamp: new Date().toISOString()
    });
    
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
    
    console.log(`[ValuationForm][${requestIdRef.current}] Form reset`, {
      timestamp: new Date().toISOString()
    });
    
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
