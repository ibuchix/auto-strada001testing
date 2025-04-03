/**
 * Changes made:
 * - 2024-12-20: Created valuation request hook extracted from useValuationForm
 * - 2024-08-17: Refactored to use standardized timeout utilities
 * - 2024-12-21: Optimized with memoization and better resource management
 * - 2024-04-03: Updated function signature in getValuation call to remove unnecessary context parameter
 */

import { useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getValuation, cleanupValuationData } from "@/components/hero/valuation/services/valuationService";
import { useRealtime } from "@/components/RealtimeProvider";
import { ValuationFormData } from "@/types/validation";
import { UseValuationRequestProps } from "./types";
import { TimeoutDurations, withTimeout } from "@/utils/timeoutUtils";

/**
 * Hook for handling valuation API requests
 */
export const useValuationRequest = ({
  onSuccess,
  onError,
  setIsLoading
}: UseValuationRequestProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isConnected } = useRealtime();
  
  // Log WebSocket connection status for debugging
  useEffect(() => {
    console.log('ValuationForm - WebSocket connection status:', isConnected ? 'connected' : 'disconnected');
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isConnected]);

  // Optimized error handlers with memoization
  const handleApiError = useCallback((errorMessage?: string) => {
    console.error('Valuation failed:', errorMessage);
    
    // Handle specific error scenarios
    if (errorMessage?.includes('rate limit') || 
        errorMessage?.includes('too many requests')) {
      toast.error("Too many requests", {
        description: "Please wait a moment before trying again.",
      });
    } else if (errorMessage === 'Request timed out') {
      // Timeout was already handled by the service
    } else if (errorMessage?.includes('WebSocket') || 
               errorMessage?.includes('connection')) {
      toast.error("Connection issue detected", {
        description: "Please check your internet connection and try again.",
      });
    } else {
      toast.error(errorMessage || "Failed to get vehicle valuation", {
        description: "Please try again or contact support if the issue persists."
      });
    }
    
    onError(new Error(errorMessage || "Valuation failed"));
  }, [onError]);

  const handleRequestError = useCallback((error: any) => {
    console.error("Valuation error:", error);
    
    // Clear timeout since we got a response
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Check for WebSocket or network errors
    const errorMessage = error.message || "Failed to get vehicle valuation";
    if (errorMessage.includes('WebSocket') || errorMessage.includes('network') || 
        errorMessage.includes('connection') || !isConnected) {
      toast.error("Connection issue detected", {
        description: "Please check your internet connection and try again.",
        action: {
          label: "Retry",
          onClick: () => console.log("Retry action triggered")
        }
      });
    } else {
      toast.error(errorMessage, {
        description: "Please check your connection and try again."
      });
    }
    
    onError(error);
  }, [onError, isConnected]);

  // Optimized request execution with error handling
  const executeRequest = useCallback(async (data: ValuationFormData) => {
    console.log('Starting valuation form submission:', data);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    // Warn user about WebSocket disconnection but proceed anyway
    if (!isConnected) {
      console.warn('WebSocket not connected during valuation request');
      toast.warning("Limited connectivity detected", {
        description: "We'll still try to get your valuation, but you may need to refresh if there are issues.",
        duration: TimeoutDurations.SHORT
      });
    }
    
    // Set a timeout to cancel the operation if it takes too long
    timeoutRef.current = setTimeout(() => {
      if (setIsLoading) {
        console.log('Valuation request timed out');
        setIsLoading(false);
        toast.error("Request timed out", {
          description: "The valuation request is taking longer than expected. Please try again.",
        });
      }
    }, TimeoutDurations.LONG); // 20 second timeout
    
    try {
      // Safely parse mileage to ensure it's a number
      const mileage = parseInt(data.mileage) || 0;
      
      console.log('Calling getValuation with parameters:', {
        vin: data.vin,
        mileage,
        gearbox: data.gearbox
      });
      
      // Use withTimeout utility to handle timeout in a more structured way
      const result = await withTimeout(
        getValuation(
          data.vin,
          mileage,
          data.gearbox
        ),
        TimeoutDurations.LONG,
        "Valuation request timed out"
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

        // Log the data with price information for debugging
        console.log('Setting valuation result with data:', {
          make: result.data.make,
          model: result.data.model,
          year: result.data.year,
          valuation: result.data.valuation,
          reservePrice: result.data.reservePrice,
          averagePrice: result.data.averagePrice
        });

        // Set the result with normalized property names - ensure both valuation and reservePrice exist
        const normalizedResult = {
          ...result.data,
          reservePrice: result.data.reservePrice || result.data.valuation, 
          valuation: result.data.valuation || result.data.reservePrice
        };
        
        onSuccess(normalizedResult);
      } else {
        handleApiError(result.data?.error);
      }
    } catch (error: any) {
      handleRequestError(error);
    } finally {
      // Make sure isLoading is set to false in all cases
      setIsLoading(false);
    }
  }, [isConnected, setIsLoading, onSuccess, handleApiError, handleRequestError]);

  return useMemo(() => ({
    executeRequest,
    isConnected
  }), [executeRequest, isConnected]);
};
