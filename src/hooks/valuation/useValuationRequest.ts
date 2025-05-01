
/**
 * Hook for handling valuation API requests
 * Created: 2025-05-10
 * Updated: 2025-05-17 - Updated mileage parameter type to be consistent (string)
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getVehicleValuation } from '@/services/api/valuationService';

export function useValuationRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [requestId] = useState(() => uuidv4().substring(0, 8));

  const executeRequest = useCallback(
    async (vin: string, mileage: string, gearbox: string) => {
      setIsLoading(true);
      console.log(`[ValuationRequest][${requestId}] Executing request for VIN: ${vin}`);

      try {
        // Convert mileage to number for API call if needed
        const mileageValue = parseInt(mileage) || 0;
        
        const result = await getVehicleValuation(
          vin, 
          mileageValue.toString(), 
          gearbox,
          { requestId }
        );
        
        return result;
      } catch (error) {
        console.error(`[ValuationRequest][${requestId}] Error:`, error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [requestId]
  );

  const cleanup = useCallback(() => {
    console.log(`[ValuationRequest][${requestId}] Cleaning up resources`);
    // Any cleanup logic here
  }, [requestId]);

  return {
    executeRequest,
    isLoading,
    requestId,
    cleanup
  };
}
