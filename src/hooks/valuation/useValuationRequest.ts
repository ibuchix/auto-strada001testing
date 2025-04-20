/**
 * Changes made:
 * - 2025-04-20: Added direct VIN validation as fallback
 * - Enhanced error handling and tracking
 */

import { useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getValuation } from "@/components/hero/valuation/services/valuationService";
import { validateVinDirectly } from "@/services/valuation/directVinService";
import { debugVinApiResponse } from "@/utils/debugging/enhanced_vin_debugging";
import { useRealtime } from "@/components/RealtimeProvider";
import { ValuationFormData } from "@/types/validation";
import { UseValuationRequestProps } from "./types";
import { TimeoutDurations } from "@/utils/timeoutUtils";

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
    // Generate using crypto for better uniqueness when available
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? 
      crypto.randomUUID().substring(0, 8) : 
      Math.random().toString(36).substring(2, 9);
    
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
      processingTime: performance.now() - requestStartTimeRef.current,
      timestamp: new Date().toISOString()
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
      processingTime: performance.now() - requestStartTimeRef.current,
      timestamp: new Date().toISOString()
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

  // Enhanced request execution with fallback mechanism
  const executeRequest = useCallback(async (data: ValuationFormData) => {
    const requestId = getRequestId();
    const startTime = performance.now();
    requestStartTimeRef.current = startTime;
    
    console.log(`[ValuationRequest][${requestId}] Starting valuation request:`, {
      vin: data.vin,
      mileage: data.mileage,
      gearbox: data.gearbox,
      timestamp: new Date().toISOString()
    });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    timeoutRef.current = setTimeout(() => {
      console.log(`[ValuationRequest][${requestId}] Request timed out`);
      setIsLoading(false);
      toast.error("Request timed out", {
        description: "The valuation request is taking longer than expected. Please try again.",
      });
    }, TimeoutDurations.LONG);
    
    try {
      const mileage = parseInt(data.mileage) || 0;
      
      // First try primary valuation method
      let result = await getValuation(
        data.vin,
        mileage,
        data.gearbox
      );
      
      // If primary method failed or returned incomplete data, try direct API
      if (!result.success || !result.data || !result.data.make || !result.data.model) {
        console.log(`[ValuationRequest][${requestId}] Primary method failed, trying direct API`);
        
        const directResult = await validateVinDirectly(data.vin, mileage);
        
        // Use direct result if it has valid data
        if (directResult && directResult.make && directResult.model) {
          result = { success: true, data: directResult };
        }
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (result.success && result.data) {
        debugVinApiResponse('valuation_success', result.data);
        
        // Store the data
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        localStorage.setItem("tempMileage", data.mileage);
        localStorage.setItem("tempVIN", data.vin);
        localStorage.setItem("tempGearbox", data.gearbox);
        localStorage.setItem("valuationTimestamp", new Date().toISOString());
        
        onSuccess(result.data);
      } else {
        const errorMessage = result.data?.error || 'Unknown valuation error';
        handleApiError(errorMessage);
      }
    } catch (error: any) {
      handleRequestError(error);
    } finally {
      const totalDuration = performance.now() - startTime;
      console.log(`[ValuationRequest][${requestId}] Request completed in ${totalDuration.toFixed(2)}ms`);
      setIsLoading(false);
    }
  }, [isConnected, setIsLoading, onSuccess, handleApiError, handleRequestError, getRequestId]);

  return useMemo(() => ({
    executeRequest,
    isConnected
  }), [executeRequest, isConnected]);
};
