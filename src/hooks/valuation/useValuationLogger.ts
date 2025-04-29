
/**
 * Valuation logging hook for consistent debug information
 * Created: 2025-05-10
 */

import { useEffect } from "react";

interface LoggerOptions {
  data: any;
  stage: string;
  enabled?: boolean;
  inspectNested?: boolean;
}

export function useValuationLogger({
  data,
  stage,
  enabled = true,
  inspectNested = false
}: LoggerOptions) {
  useEffect(() => {
    if (!enabled) return;
    
    const logGroup = `ValuationLogger:${stage}`;
    
    try {
      console.group(logGroup);
      
      console.log("Raw data received:", data);
      
      if (data) {
        console.log("Data type:", typeof data);
        console.log("Top level keys:", Object.keys(data));
        
        if (data.make || data.model) {
          console.log("Vehicle details:", {
            make: data.make,
            model: data.model,
            year: data.year,
            vin: data.vin
          });
        }
        
        if (data.reservePrice || data.valuation) {
          console.log("Price information:", {
            reservePrice: data.reservePrice,
            valuation: data.valuation,
            basePrice: data.basePrice,
            averagePrice: data.averagePrice
          });
        }
        
        if (data.error) {
          console.log("Error information:", {
            error: data.error,
            noData: data.noData
          });
        }
        
        if (inspectNested) {
          // Scan for nested data structures
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              console.log(`Nested data in ${key}:`, value);
            }
          });
        }
      }
    } catch (error) {
      console.error(`Error in ValuationLogger:${stage}`, error);
    } finally {
      console.groupEnd();
    }
  }, [data, stage, enabled, inspectNested]);
  
  return null;
}
