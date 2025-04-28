
/**
 * Valuation request hook
 * Updated: 2025-04-28 - Enhanced parameter validation and error handling
 */

import { useState, useCallback } from 'react';
import { getDirectValuation } from '@/services/valuation/directValuationService';
import { toast } from 'sonner';
import { validateValuationParams } from '@/utils/debugging/enhanced_vin_debugging';
import { supabase } from '@/integrations/supabase/client';

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

      // Attempt edge function call
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
        throw edgeFunctionError;
      }

      if (!edgeFunctionData || !edgeFunctionData.success) {
        throw new Error(edgeFunctionData?.error || 'Failed to get valuation');
      }
      
      console.log(`[ValuationRequest][${requestId}] Success:`, edgeFunctionData);
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
