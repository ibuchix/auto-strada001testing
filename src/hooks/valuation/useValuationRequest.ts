
/**
 * Changes made:
 * - 2025-04-20: Added direct VIN validation as fallback
 * - Enhanced error handling and tracking
 * - 2025-04-21: ADDED STEP-BY-STEP LOGGING TO TRACE VIN CHECK & VALUATION LOGIC
 * - 2025-04-22: ADDED DEEP DATA STRUCTURE INSPECTION FOR DEBUGGING API RESPONSES
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

  // Utility function to log API response details
  const inspectApiResponse = useCallback((data: any, source: string) => {
    if (!data) {
      console.log(`[ValuationRequest][${requestIdRef.current}] [${source}] No data in response`);
      return;
    }

    const summary = {
      hasData: !!data,
      topLevelKeys: Object.keys(data),
      hasMake: !!data.make,
      hasModel: !!data.model,
      hasYear: !!data.year,
      hasVin: !!data.vin,
      hasValuation: typeof data.valuation === 'number' && data.valuation > 0,
      hasReservePrice: typeof data.reservePrice === 'number' && data.reservePrice > 0,
      hasBasePrice: typeof data.basePrice === 'number' && data.basePrice > 0,
      hasAveragePrice: typeof data.averagePrice === 'number' && data.averagePrice > 0,
      hasError: !!data.error,
      isSuccess: !!data.success,
      hasFunctionResponse: !!data.functionResponse,
      hasPriceMin: data.price_min !== undefined,
      hasPriceMed: data.price_med !== undefined
    };

    // Check for nested price data
    if (data.functionResponse?.valuation?.calcValuation) {
      summary['hasNestedCalcValuation'] = true;
      summary['nestedPriceMin'] = data.functionResponse.valuation.calcValuation.price_min;
      summary['nestedPriceMed'] = data.functionResponse.valuation.calcValuation.price_med;
    }

    console.log(`[ValuationRequest][${requestIdRef.current}] [${source}] Response structure:`, summary);
    
    // Try to log raw pricing for debugging
    try {
      console.log(`[ValuationRequest][${requestIdRef.current}] [${source}] Price fields:`, {
        price: data.price,
        valuation: data.valuation,
        reservePrice: data.reservePrice,
        basePrice: data.basePrice,
        averagePrice: data.averagePrice,
        price_min: data.price_min,
        price_med: data.price_med
      });
    } catch (e) {
      console.log(`[ValuationRequest][${requestIdRef.current}] [${source}] Error logging price fields`);
    }
  }, []);

  // Optimized error handlers with memoization
  const handleApiError = useCallback((errorMessage?: string) => {
    console.error(`[ValuationRequest][${requestIdRef.current}] Valuation failed:`, {
      error: errorMessage,
      processingTime: performance.now() - requestStartTimeRef.current,
      timestamp: new Date().toISOString()
    });
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
    onError(error);
  }, [onError, isConnected]);

  // Enhanced request execution with fallback mechanism
  const executeRequest = useCallback(async (data: ValuationFormData) => {
    const requestId = getRequestId();
    const startTime = performance.now();
    requestStartTimeRef.current = startTime;
    
    console.log(`[ValuationRequest][${requestId}] START valuation request with data:`, data);
    
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
      // 1. Try primary valuation method
      console.log(`[ValuationRequest][${requestId}] Calling getValuation...`);
      let result = await getValuation(
        data.vin,
        mileage,
        data.gearbox
      );
      console.log(`[ValuationRequest][${requestId}] getValuation returned:`, result);
      
      // Inspect the API response structure
      if (result?.data) {
        inspectApiResponse(result.data, 'PRIMARY_API');
      }

      // If primary method failed or returned incomplete data, try direct API
      if (!result.success || !result.data || !result.data.make || !result.data.model) {
        console.warn(`[ValuationRequest][${requestId}] PRIMARY METHOD failed or incomplete, trying direct API`);
        const directResult = await validateVinDirectly(data.vin, mileage);
        console.log(`[ValuationRequest][${requestId}] validateVinDirectly result:`, directResult);
        
        // Inspect the fallback API response
        inspectApiResponse(directResult, 'FALLBACK_API');
        
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
        console.log(`[ValuationRequest][${requestId}] FINAL SUCCESS - DATA:`, result.data);
        debugVinApiResponse('valuation_success', result.data);
        
        // Check if this data has actually useful price data
        const hasPriceData = result.data.valuation > 0 || 
          result.data.reservePrice > 0 || 
          result.data.basePrice > 0 || 
          result.data.averagePrice > 0;
          
        if (!hasPriceData) {
          console.warn(`[ValuationRequest][${requestId}] WARNING: API returned success but no price data!`, {
            valuation: result.data.valuation,
            reservePrice: result.data.reservePrice,
            basePrice: result.data.basePrice,
            averagePrice: result.data.averagePrice
          });
        }
        
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
      console.log(`[ValuationRequest][${requestId}] END. Request completed in ${totalDuration.toFixed(2)}ms`);
      setIsLoading(false);
    }
  }, [isConnected, setIsLoading, onSuccess, handleApiError, handleRequestError, getRequestId, inspectApiResponse]);

  return useMemo(() => ({
    executeRequest,
    isConnected
  }), [executeRequest, isConnected]);
};
