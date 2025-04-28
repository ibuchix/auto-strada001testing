
/**
 * Valuation request hook
 * Updated: 2025-04-28 - Enhanced valuation request to handle nested response data
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateValuationParams } from '@/utils/debugging/enhanced_vin_debugging';

export function useValuationRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const requestValuation = useCallback(async (
    vin: string,
    mileage: number | string,
    gearbox: string = 'manual'
  ) => {
    setIsLoading(true);
    setError(null);
    
    const requestId = crypto.randomUUID();
    console.log(`[ValuationRequest][${requestId}] Starting request:`, { vin, mileage, gearbox });
    
    try {
      // Clean and validate parameters
      const cleanVin = String(vin).trim().toUpperCase();
      const cleanMileage = typeof mileage === 'string' ? parseInt(mileage.replace(/[^0-9]/g, ''), 10) : mileage;
      const cleanGearbox = gearbox.toLowerCase() as 'manual' | 'automatic';
      
      // Validate parameters before making the request
      if (cleanVin.length !== 17 || !/^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin)) {
        throw new Error('Invalid VIN format');
      }
      
      if (isNaN(cleanMileage) || cleanMileage < 0 || cleanMileage > 1000000) {
        throw new Error('Invalid mileage value');
      }
      
      if (!['manual', 'automatic'].includes(cleanGearbox)) {
        throw new Error('Invalid transmission type');
      }
      
      console.log(`[ValuationRequest][${requestId}] Using cleaned parameters:`, {
        vin: cleanVin,
        mileage: cleanMileage,
        gearbox: cleanGearbox
      });

      // Make direct edge function call
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
        'get-vehicle-valuation',
        {
          body: {
            vin: cleanVin,
            mileage: cleanMileage,
            gearbox: cleanGearbox,
            requestId
          }
        }
      );
      
      if (edgeFunctionError) {
        console.error(`[ValuationRequest][${requestId}] Edge function error:`, edgeFunctionError);
        throw edgeFunctionError;
      }

      if (!edgeFunctionData || !edgeFunctionData.success) {
        console.error(`[ValuationRequest][${requestId}] API error:`, edgeFunctionData);
        throw new Error(edgeFunctionData?.error || 'Failed to get valuation');
      }
      
      // Log successful response and data structure
      console.log(`[ValuationRequest][${requestId}] Success:`, {
        data: edgeFunctionData.data,
        hasDataObject: !!edgeFunctionData.data,
        hasVehicleDetails: !!(edgeFunctionData.data?.make && edgeFunctionData.data?.model),
        hasPricing: !!(edgeFunctionData.data?.reservePrice || edgeFunctionData.data?.valuation)
      });
      
      // Validate critical data is present
      if (!edgeFunctionData.data?.make || !edgeFunctionData.data?.model) {
        console.error(`[ValuationRequest][${requestId}] Missing vehicle details in response:`, edgeFunctionData.data);
        throw new Error('Vehicle details not found in valuation response');
      }

      if (!edgeFunctionData.data?.reservePrice && !edgeFunctionData.data?.valuation) {
        console.error(`[ValuationRequest][${requestId}] Missing pricing data in response:`, edgeFunctionData.data);
        throw new Error('Pricing information not found in valuation response');
      }
      
      // Set result with standardized data
      setResult(edgeFunctionData.data);
      return edgeFunctionData.data;
      
    } catch (err: any) {
      console.error(`[ValuationRequest][${requestId}] Error:`, err);
      const errorMessage = err.message || 'Failed to get valuation';
      setError(errorMessage);
      toast.error('Validation Error', {
        description: errorMessage
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    requestValuation,
    isLoading,
    result,
    error,
    reset
  };
}
