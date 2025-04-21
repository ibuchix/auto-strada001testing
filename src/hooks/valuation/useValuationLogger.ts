
/**
 * A custom hook for logging detailed valuation data
 * Created: 2025-04-22
 */

import { useEffect } from 'react';

type ValuationLoggerProps = {
  data?: any;
  stage: string; 
  enabled?: boolean;
};

/**
 * Hook for logging detailed valuation data during development
 */
export const useValuationLogger = ({ data, stage, enabled = true }: ValuationLoggerProps) => {
  useEffect(() => {
    if (!enabled || !data) return;
    
    // Only log in development mode unless forced
    if (process.env.NODE_ENV !== 'development' && !enabled) return;
    
    console.group(`[Valuation Logger][${stage}]`);
    
    // Basic data structure
    console.log('Basic data structure:', {
      type: typeof data,
      isNull: data === null,
      isUndefined: data === undefined,
      keysLength: typeof data === 'object' ? Object.keys(data).length : 0,
      keys: typeof data === 'object' ? Object.keys(data) : []
    });
    
    if (typeof data === 'object' && data !== null) {
      // Vehicle data
      console.log('Vehicle data:', {
        make: data.make,
        model: data.model,
        year: data.year,
        vin: data.vin,
        transmission: data.transmission,
        mileage: data.mileage
      });
      
      // Price data
      console.log('Price data:', {
        valuation: data.valuation,
        reservePrice: data.reservePrice,
        basePrice: data.basePrice,
        averagePrice: data.averagePrice,
        price: data.price,
        price_min: data.price_min,
        price_med: data.price_med
      });
      
      // Check for nested data structures
      if (data.functionResponse) {
        console.log('Has functionResponse with keys:', Object.keys(data.functionResponse));
        
        if (data.functionResponse.valuation?.calcValuation) {
          console.log('Nested calcValuation:', data.functionResponse.valuation.calcValuation);
        }
      }
      
      // Error states
      console.log('Error states:', {
        hasError: !!data.error,
        error: data.error,
        noData: data.noData,
        isExisting: data.isExisting
      });
    }
    
    console.groupEnd();
  }, [data, stage, enabled]);
  
  return null;
};
