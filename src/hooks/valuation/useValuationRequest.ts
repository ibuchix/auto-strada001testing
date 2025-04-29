
/**
 * Valuation request hook to handle API interactions
 * Created: 2025-05-10
 */

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getValuation } from "@/components/hero/valuation/services/valuationService";
import { validateValuationParams } from "@/utils/debugging/enhanced_vin_debugging";

export function useValuationRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef<string>(Math.random().toString(36).substring(2, 10));

  const executeRequest = useCallback(async (
    vin: string,
    mileage: number | string,
    gearbox: string
  ) => {
    const startTime = performance.now();
    
    console.log(`[ValuationRequest][${requestIdRef.current}] Starting request:`, {
      vin,
      mileage,
      gearbox,
      timestamp: new Date().toISOString()
    });
    
    // Validate and clean parameters
    const validationResult = validateValuationParams(
      vin,
      typeof mileage === 'string' ? parseInt(mileage, 10) : mileage,
      gearbox
    );
    
    if (!validationResult.valid) {
      return {
        success: false, 
        error: validationResult.error || "Please check your input values"
      };
    }
    
    // Get the cleaned parameters
    const { vin: cleanVin, mileage: cleanMileage, gearbox: cleanGearbox } = validationResult.cleanedParams!;
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsLoading(true);
    
    // Set a timeout to cancel the operation if it takes too long
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      console.warn(`[ValuationRequest][${requestIdRef.current}] Request timed out after 20 seconds`);
      return {
        success: false,
        error: "Request timed out"
      };
    }, 20000); // 20 second timeout
    
    try {
      console.log(`[ValuationRequest][${requestIdRef.current}] Calling getValuation with parameters:`, {
        vin: cleanVin,
        mileage: cleanMileage,
        gearbox: cleanGearbox,
        timestamp: new Date().toISOString()
      });
      
      const result = await getValuation(
        cleanVin,
        cleanMileage,
        cleanGearbox,
        { requestId: requestIdRef.current }
      );

      console.log(`[ValuationRequest][${requestIdRef.current}] Valuation result:`, {
        success: result.success,
        errorPresent: result.error !== undefined,
        dataSize: result.data ? JSON.stringify(result.data).length : 0,
        dataFields: result.data ? Object.keys(result.data) : [],
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });

      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      return result;
    } catch (err: any) {
      console.error(`[ValuationRequest][${requestIdRef.current}] Error:`, err);
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      return {
        success: false,
        error: err.message || 'Failed to get vehicle valuation',
        data: null
      };
    } finally {
      const totalDuration = performance.now() - startTime;
      console.log(`[ValuationRequest][${requestIdRef.current}] Request completed in ${totalDuration.toFixed(2)}ms`);
      setIsLoading(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    executeRequest,
    isLoading,
    requestId: requestIdRef.current,
    cleanup
  };
}
