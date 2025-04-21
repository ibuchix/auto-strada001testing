
/**
 * A custom hook for logging detailed valuation data
 * Created: 2025-04-22
 * Updated: 2025-04-23 - Enhanced price data debugging and added API response inspection
 */

import { useEffect } from 'react';

type ValuationLoggerProps = {
  data?: any;
  stage: string; 
  enabled?: boolean;
  inspectNested?: boolean;
};

/**
 * Hook for logging detailed valuation data during development
 * Provides comprehensive debug information about the valuation data structure
 * and helps identify where pricing information might be missing
 */
export const useValuationLogger = ({ 
  data, 
  stage, 
  enabled = true,
  inspectNested = false
}: ValuationLoggerProps) => {
  useEffect(() => {
    if (!enabled || !data) return;
    
    // Only log in development mode unless forced
    if (process.env.NODE_ENV !== 'development' && !enabled) return;
    
    console.group(`[Valuation Logger][${stage}]`);
    
    // Basic data structure analysis
    console.log('Basic data structure:', {
      type: typeof data,
      isNull: data === null,
      isUndefined: data === undefined,
      keysLength: typeof data === 'object' ? Object.keys(data).length : 0,
      keys: typeof data === 'object' ? Object.keys(data) : [],
      timestamp: new Date().toISOString()
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
      
      // Price data - enhanced with type checking and data source identification
      const priceData = {
        valuation: { value: data.valuation, type: typeof data.valuation },
        reservePrice: { value: data.reservePrice, type: typeof data.reservePrice },
        basePrice: { value: data.basePrice, type: typeof data.basePrice },
        averagePrice: { value: data.averagePrice, type: typeof data.averagePrice },
        price: { value: data.price, type: typeof data.price },
        price_min: { value: data.price_min, type: typeof data.price_min },
        price_med: { value: data.price_med, type: typeof data.price_med }
      };
      
      console.log('Price data (detailed):', priceData);
      
      // Price validation check
      console.log('Price validation:', {
        hasAnyPriceData: Object.values(priceData).some(item => 
          item.type === 'number' && item.value > 0
        ),
        hasValidValuation: typeof data.valuation === 'number' && data.valuation > 0,
        hasValidReservePrice: typeof data.reservePrice === 'number' && data.reservePrice > 0,
        willUseDefaultPrice: !Object.values(priceData).some(item => 
          item.type === 'number' && item.value > 0
        ),
        usingFallbackEstimation: data.usingFallbackEstimation === true
      });
      
      // Enhanced API response inspection
      if (inspectNested) {
        // Scan for any nested price-related fields
        const findPriceFields = (obj: any, prefix = '', results: Record<string, any> = {}) => {
          if (!obj || typeof obj !== 'object') return results;
          
          Object.entries(obj).forEach(([key, value]) => {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            
            if (
              key.toLowerCase().includes('price') || 
              key.toLowerCase().includes('value') ||
              key.toLowerCase().includes('valuation') ||
              key.toLowerCase().includes('cost')
            ) {
              results[fullKey] = value;
            }
            
            // Recursively check nested objects, but not arrays
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              findPriceFields(value, fullKey, results);
            }
          });
          
          return results;
        };
        
        const allPriceFields = findPriceFields(data);
        console.log('All price-related fields found in response:', allPriceFields);
        
        // Check for functionResponse structure (common in our API)
        if (data.functionResponse) {
          console.log('functionResponse structure:', {
            hasData: !!data.functionResponse,
            keys: Object.keys(data.functionResponse),
            hasAPIData: !!data.functionResponse.api,
            hasValuationData: !!data.functionResponse.valuation,
            hasUserParams: !!data.functionResponse.userParams
          });
          
          // Specifically check for price calculation data
          if (data.functionResponse.valuation?.calcValuation) {
            console.log('Nested calcValuation data:', {
              data: data.functionResponse.valuation.calcValuation,
              price_min: data.functionResponse.valuation.calcValuation.price_min,
              price_med: data.functionResponse.valuation.calcValuation.price_med,
              price: data.functionResponse.valuation.calcValuation.price
            });
          }
          
          // Check for raw API response
          if (data.functionResponse.api?.rawResponse) {
            console.log('API raw response details:', {
              responseSize: typeof data.functionResponse.api.rawResponse === 'string' 
                ? data.functionResponse.api.rawResponse.length 
                : JSON.stringify(data.functionResponse.api.rawResponse).length,
              hasData: !!data.functionResponse.api.rawResponse,
              isParsed: typeof data.functionResponse.api.rawResponse !== 'string'
            });
          }
        }
      }
      
      // Error states
      console.log('Error states:', {
        hasError: !!data.error,
        error: data.error,
        noData: data.noData,
        isExisting: data.isExisting,
        errorCode: data.errorCode
      });
    }
    
    console.groupEnd();
  }, [data, stage, enabled, inspectNested]);
  
  return null;
};
