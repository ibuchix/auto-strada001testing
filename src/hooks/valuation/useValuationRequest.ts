
/**
 * Valuation request hook
 * Created: 2025-05-10 - Fixed function signatures and improved API handling
 */

import { useState, useCallback } from 'react';
import { getDirectValuation } from '@/services/valuation/directValuationService';
import { toast } from 'sonner';
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
    
    try {
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
      
      // Make the API call
      const response = await getDirectValuation(
        cleanedParams!.vin,
        cleanedParams!.mileage,
        cleanedParams!.gearbox
      );
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get valuation');
      }
      
      setResult(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get valuation';
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
