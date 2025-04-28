
/**
 * Valuation request hook
 * Created: 2025-05-10 - Fixed function signatures and improved API handling
 * Updated: 2025-05-10 - Added comprehensive error handling and logging
 * Updated: 2025-05-11 - Improved CORS handling and error recovery
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
    
    try {
      console.log('[ValuationRequest] Starting valuation request for:', { vin, mileage, gearbox });
      
      // First validate the parameters
      const validationResult = validateValuationParams(
        vin,
        typeof mileage === 'string' ? parseInt(mileage, 10) : mileage,
        gearbox
      );
      
      if (!validationResult.valid) {
        throw new Error(validationResult.error || 'Invalid input parameters');
      }
      
      // Get cleaned parameters
      const { cleanedParams } = validationResult;
      
      // First try the edge function approach (which handles CORS properly)
      console.log('[ValuationRequest] Attempting valuation via Edge Function');
      
      // Use supabase functions.invoke which properly handles authentication and paths
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
        'get-vehicle-valuation',
        {
          body: {
            vin: cleanedParams!.vin,
            mileage: cleanedParams!.mileage,
            gearbox: cleanedParams!.gearbox,
          }
        }
      );
      
      // Check if the edge function succeeded
      if (edgeFunctionData && !edgeFunctionError) {
        console.log('[ValuationRequest] Successful edge function response:', edgeFunctionData);
        setResult(edgeFunctionData.data);
        return edgeFunctionData.data;
      }
      
      // If the edge function failed, try direct API call via our proxy
      console.log('[ValuationRequest] Edge function failed, trying direct valuation');
      
      const directResponse = await getDirectValuation(
        cleanedParams!.vin,
        cleanedParams!.mileage,
        cleanedParams!.gearbox
      );
      
      if (!directResponse.success) {
        throw new Error(directResponse.error || 'Failed to get valuation');
      }
      
      console.log('[ValuationRequest] Successful direct valuation:', directResponse.data);
      setResult(directResponse.data);
      
      return directResponse.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get valuation';
      console.error('[ValuationRequest] Error:', errorMsg);
      
      setError(errorMsg);
      toast.error(errorMsg);
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
