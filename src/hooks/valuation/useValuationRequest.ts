
/**
 * Changes made:
 * - 2024-12-20: Created valuation request hook extracted from useValuationForm
 * - 2024-08-17: Refactored to use standardized timeout utilities
 * - 2024-12-21: Optimized with memoization and better resource management
 * - 2024-04-03: Updated function signature in getValuation call to remove unnecessary context parameter
 * - 2024-04-03: Enhanced debug logging for performance tracking and troubleshooting
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
  const requestIdRef = useRef<string>('');
  const requestStartTimeRef = useRef<number>(0);
  
  // Log WebSocket connection status for debugging
  useEffect(() => {
    console.log('[ValuationRequest] WebSocket connection status:', isConnected ? 'connected' : 'disconnected');
    
    return () => {
      if (timeoutRef.current) {
        console.log('[ValuationRequest] Clearing timeout on unmount');
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isConnected]);

  // Generate a unique request ID for tracing
  const getRequestId = useCallback(() => {
    const id = Math.random().toString(36).substring(2, 9);
    requestIdRef.current = id;
    return id;
  }, []);
  
  // Log timing information
  const logTiming = useCallback((stage: string, startTime: number) => {
    const duration = performance.now() - startTime;
    console.log(`[ValuationRequest][${requestIdRef.current}] ${stage} completed in ${duration.toFixed(2)}ms`);
    return duration;
  }, []);

  // Optimized error handlers with memoization
  const handleApiError = useCallback((errorMessage?: string) => {
    console.error(`[ValuationRequest][${requestIdRef.current}] Valuation failed:`, {
      error: errorMessage,
      processingTime: performance.now() - requestStartTimeRef.current
    });
    
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
    console.error(`[ValuationRequest][${requestIdRef.current}] Error:`, {
      message: error.message,
      type: error.constructor?.name,
      stack: error.stack,
      processingTime: performance.now() - requestStartTimeRef.current
    });
    
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
          onClick: () => console.log(`[ValuationRequest][${requestIdRef.current}] Retry action triggered`)
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
    const requestId = getRequestId();
    const startTime = performance.now();
    requestStartTimeRef.current = startTime;
    
    console.log(`[ValuationRequest][${requestId}] Starting valuation request:`, {
      vin: data.vin,
      mileage: data.mileage,
      gearbox: data.gearbox,
      timestamp: new Date().toISOString(),
      isConnected
    });
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    // Warn user about WebSocket disconnection but proceed anyway
    if (!isConnected) {
      console.warn(`[ValuationRequest][${requestId}] WebSocket not connected during valuation request`);
      toast.warning("Limited connectivity detected", {
        description: "We'll still try to get your valuation, but you may need to refresh if there are issues.",
        duration: TimeoutDurations.SHORT
      });
    }
    
    // Set a timeout to cancel the operation if it takes too long
    timeoutRef.current = setTimeout(() => {
      if (setIsLoading) {
        console.log(`[ValuationRequest][${requestId}] Request timed out after ${TimeoutDurations.LONG}ms`);
        setIsLoading(false);
        toast.error("Request timed out", {
          description: "The valuation request is taking longer than expected. Please try again.",
        });
      }
    }, TimeoutDurations.LONG); // 20 second timeout
    
    try {
      // Safely parse mileage to ensure it's a number
      const mileage = parseInt(data.mileage) || 0;
      
      console.log(`[ValuationRequest][${requestId}] Calling getValuation with parameters:`, {
        vin: data.vin,
        mileage,
        gearbox: data.gearbox
      });
      
      // Use withTimeout utility to handle timeout in a more structured way
      const valuationStartTime = performance.now();
      const result = await withTimeout(
        getValuation(
          data.vin,
          mileage,
          data.gearbox
        ),
        TimeoutDurations.LONG,
        "Valuation request timed out"
      );
      const valuationDuration = logTiming('API call', valuationStartTime);

      console.log(`[ValuationRequest][${requestId}] Valuation result received:`, {
        success: result.success,
        error: result.error || null,
        dataSize: result.data ? JSON.stringify(result.data).length : 0,
        duration: `${valuationDuration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (result.success) {
        const storageStartTime = performance.now();
        
        // Store the valuation data in localStorage
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        localStorage.setItem("tempMileage", data.mileage);
        localStorage.setItem("tempVIN", data.vin);
        localStorage.setItem("tempGearbox", data.gearbox);
        localStorage.setItem("valuationTimestamp", new Date().toISOString());
        localStorage.setItem("valuationRequestId", requestId);
        
        logTiming('localStorage storage', storageStartTime);

        // Log the data with price information for debugging
        console.log(`[ValuationRequest][${requestId}] Setting valuation result:`, {
          make: result.data.make,
          model: result.data.model,
          year: result.data.year,
          valuation: result.data.valuation,
          reservePrice: result.data.reservePrice,
          averagePrice: result.data.averagePrice,
          processingTime: performance.now() - startTime
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
      const totalDuration = performance.now() - startTime;
      console.log(`[ValuationRequest][${requestId}] Request completed in ${totalDuration.toFixed(2)}ms`);
      setIsLoading(false);
    }
  }, [isConnected, setIsLoading, onSuccess, handleApiError, handleRequestError, getRequestId, logTiming]);

  return useMemo(() => ({
    executeRequest,
    isConnected
  }), [executeRequest, isConnected]);
};
