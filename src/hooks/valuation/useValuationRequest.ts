/**
 * Changes made:
 * - 2025-04-20: Added direct VIN validation as fallback
 * - Enhanced error handling and tracking
 * - 2025-04-21: ADDED STEP-BY-STEP LOGGING TO TRACE VIN CHECK & VALUATION LOGIC
 * - 2025-04-22: ADDED DEEP DATA STRUCTURE INSPECTION FOR DEBUGGING API RESPONSES
 * - 2025-04-25: ADDED DEBUG MODE AND API RESPONSE INSPECTION TO FIX PRICE DATA ISSUES
 * - 2025-04-29: ADDED HIGHLY VISIBLE CONSOLE LOGS FOR DEBUGGING
 * - 2025-04-30: Fixed import for deepScanForPrices utility
 * - 2025-04-26: Fixed error property missing in return object
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
import { deepScanForPrices } from "@/utils/valuation/priceExtractor";

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
    console.log('%c🔌 WebSocket connection status:', 'font-weight: bold; color: #3F51B5', isConnected ? 'connected' : 'disconnected');
    return () => {
      if (timeoutRef.current) {
        console.log('%c⏱️ Clearing timeout on unmount', 'color: #607D8B');
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
    console.log(`%c⏱️ ${stage} completed in ${duration.toFixed(2)}ms`, 'color: #8BC34A; font-weight: bold');
    return duration;
  }, []);

  // Utility function to log API response details
  const inspectApiResponse = useCallback((data: any, source: string) => {
    if (!data) {
      console.log(`%c🔍 [${source}] No data in response`, 'color: #F44336; font-weight: bold');
      return;
    }

    console.log(`%c🔍 [${source}] RESPONSE INSPECTION:`, 'background: #673AB7; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');

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

    console.table(summary);

    // Check for nested price data
    if (data.functionResponse?.valuation?.calcValuation) {
      console.log(`%c🔍 [${source}] NESTED CALC VALUATION FOUND:`, 'background: #009688; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
      console.table({
        nestedPriceMin: data.functionResponse.valuation.calcValuation.price_min,
        nestedPriceMed: data.functionResponse.valuation.calcValuation.price_med
      });
    }

    // Deep scan for any price-related fields in the response
    const priceFields = deepScanForPrices(data);
    if (Object.keys(priceFields).length > 0) {
      console.log(`%c💰 [${source}] PRICE FIELDS FROM DEEP SCAN:`, 'background: #FF9800; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
      console.table(priceFields);
    } else {
      console.warn(`%c⚠️ [${source}] NO PRICE FIELDS FOUND IN DEEP SCAN`, 'background: #F44336; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
    }
    
    // Try to log raw pricing for debugging
    try {
      console.log(`%c💰 [${source}] DIRECT PRICE FIELDS:`, 'background: #2196F3; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
      console.table({
        price: data.price,
        valuation: data.valuation,
        reservePrice: data.reservePrice,
        basePrice: data.basePrice,
        averagePrice: data.averagePrice,
        price_min: data.price_min,
        price_med: data.price_med
      });
    } catch (e) {
      console.log(`%c❌ [${source}] Error logging price fields`, 'color: #F44336');
    }
  }, []);

  // Optimized error handlers with memoization
  const handleApiError = useCallback((errorMessage?: string) => {
    console.error(`%c❌ Valuation failed:`, 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
      error: errorMessage,
      processingTime: performance.now() - requestStartTimeRef.current,
      timestamp: new Date().toISOString()
    });
    onError(new Error(errorMessage || "Valuation failed"));
  }, [onError]);

  const handleRequestError = useCallback((error: any) => {
    console.error(`%c❌ ERROR:`, 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
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
    
    console.log('%c🚀 STARTING VALUATION REQUEST', 'background: #FF5722; color: white; font-size: 16px; padding: 4px 8px; border-radius: 4px');
    console.log('%c📝 Request Parameters:', 'font-weight: bold; color: #0066cc');
    console.table(data);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      console.log(`%c⏱️ Request timed out`, 'background: #795548; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
      setIsLoading(false);
      toast.error("Request timed out", {
        description: "The valuation request is taking longer than expected. Please try again.",
      });
    }, TimeoutDurations.LONG);
    
    try {
      const mileage = parseInt(data.mileage) || 0;
      
      // 1. Try primary valuation method with debug mode enabled
      console.log('%c🔍 STEP 1: Calling primary valuation method...', 'background: #3F51B5; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
      let result = await getValuation(
        data.vin,
        mileage,
        data.gearbox,
        { debug: true, requestId } // Add debug flag and request ID for tracing
      );
      console.log('%c🔍 STEP 1 RESULT:', 'color: #3F51B5; font-weight: bold', {
        success: result.success,
        hasData: !!result.data,
        hasError: !!result.error
      });
      
      // Inspect the API response structure in detail
      if (result?.data) {
        console.log('%c📊 PRIMARY API RESPONSE DATA:', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
        console.dir(result.data);
        inspectApiResponse(result.data, 'PRIMARY_API');
      }

      // If primary method failed or returned incomplete data, try direct API
      if (!result.success || !result.data || !result.data.make || !result.data.model) {
        console.warn('%c⚠️ PRIMARY METHOD FAILED OR INCOMPLETE - TRYING FALLBACK API...', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
        
        console.log('%c🔍 STEP 2: Calling direct VIN validation...', 'background: #9C27B0; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
        const directResult = await validateVinDirectly(data.vin, mileage);
        console.log('%c🔍 STEP 2 RESULT:', 'color: #9C27B0; font-weight: bold', {
          success: !!directResult,
          hasVehicleData: !!(directResult?.make && directResult?.model)
        });
        
        // Inspect the fallback API response in detail
        console.log('%c📊 FALLBACK API RESPONSE DATA:', 'background: #FF5722; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
        console.dir(directResult);
        inspectApiResponse(directResult, 'FALLBACK_API');
        
        // Use direct result if it has valid data
        if (directResult && directResult.make && directResult.model) {
          console.log('%c✅ USING FALLBACK API RESULT', 'background: #8BC34A; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
          result = { 
            success: true, 
            data: directResult,
            error: null  // Add the error property to match expected type
          };
        } else {
          console.warn('%c⚠️ FALLBACK API ALSO FAILED', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
        }
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (result.success && result.data) {
        console.log('%c✅ VALUATION SUCCESS - FINAL DATA:', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
        console.dir(result.data);
        debugVinApiResponse('valuation_success', result.data);
        
        // Check if this data has actually useful price data
        const hasPriceData = result.data.valuation > 0 || 
          result.data.reservePrice > 0 || 
          result.data.basePrice > 0 || 
          result.data.averagePrice > 0;
          
        if (!hasPriceData) {
          console.warn('%c⚠️ WARNING: API RETURNED SUCCESS BUT NO PRICE DATA!', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
            valuation: result.data.valuation,
            reservePrice: result.data.reservePrice,
            basePrice: result.data.basePrice,
            averagePrice: result.data.averagePrice
          });
          
          // If we have make/model/year but no price, force the estimated price calculation
          if (result.data.make && result.data.model && result.data.year) {
            console.log('%c💰 FORCING ESTIMATED PRICE CALCULATION', 'background: #673AB7; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
            result.data.apiSource = 'estimation';
            result.data.estimationMethod = 'make_model_year';
            result.data.usingFallbackEstimation = true;
          }
        }
        
        // Store the data
        localStorage.setItem("valuationData", JSON.stringify(result.data));
        localStorage.setItem("tempMileage", data.mileage);
        localStorage.setItem("tempVIN", data.vin);
        localStorage.setItem("tempGearbox", data.gearbox);
        localStorage.setItem("valuationTimestamp", new Date().toISOString());
        
        console.log('%c✅ DATA STORED AND PROCESSING COMPLETE', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
        onSuccess(result.data);
      } else {
        const errorMessage = result.data?.error || 'Unknown valuation error';
        handleApiError(errorMessage);
      }
    } catch (error: any) {
      handleRequestError(error);
    } finally {
      const totalDuration = performance.now() - startTime;
      console.log(`%c⏱️ REQUEST COMPLETED in ${totalDuration.toFixed(2)}ms`, 'background: #607D8B; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
      setIsLoading(false);
    }
  }, [isConnected, setIsLoading, onSuccess, handleApiError, handleRequestError, getRequestId, inspectApiResponse]);

  return useMemo(() => ({
    executeRequest,
    isConnected
  }), [executeRequest, isConnected]);
};
