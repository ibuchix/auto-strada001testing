
/**
 * Enhanced valuation service with monitoring
 * Updated: 2025-04-26 - Refactored to handle raw API response
 * Updated: 2025-04-26 - Added success property to return value for type consistency
 * Updated: 2025-04-29 - Fixed request format to use POST body instead of URL params
 * Updated: 2025-04-30 - Enhanced error logging and debugging
 * Updated: 2025-05-01 - Fixed request handling and parameter validation
 */

import { ValuationMonitoring } from '../monitoring/valuationMonitoring';
import { supabase } from "@/integrations/supabase/client";
import { ApiError } from "../errors/apiError";
import { toast } from "sonner";

export async function getVehicleValuation(
  vin: string, 
  mileage: number, 
  gearbox: string
) {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    // Input validation
    if (!vin || typeof vin !== 'string' || vin.trim().length < 5) {
      console.error(`[VALUATION-API][${requestId}] Invalid VIN:`, vin);
      throw new Error('Invalid VIN format');
    }
    
    // Clean and standardize inputs
    const cleanVin = vin.trim().replace(/\s+/g, '');
    const cleanMileage = typeof mileage === 'number' && !isNaN(mileage) ? mileage : 0;
    const cleanGearbox = gearbox || 'manual';
    
    console.log(`[VALUATION-API][${requestId}] Getting valuation for:`, { 
      vin: cleanVin, 
      mileage: cleanMileage, 
      gearbox: cleanGearbox 
    });
    
    // Use body parameter for the request with request ID for tracing
    const { data, error } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: { 
          vin: cleanVin, 
          mileage: cleanMileage, 
          gearbox: cleanGearbox,
          debug: true, // Enable debug mode for detailed response
          requestId
        }
      }
    );
    
    const executionTime = performance.now() - startTime;

    if (error) {
      console.error(`[VALUATION-API][${requestId}] Error:`, error);
      console.error(`[VALUATION-API][${requestId}] Error details:`, {
        message: error.message,
        name: error.name,
        status: error.status,
        context: error.context
      });
      
      ValuationMonitoring.trackValuation({
        vin: cleanVin,
        hasPricingData: false,
        usedFallbackValues: false,
        dataQualityScore: 0,
        executionTimeMs: executionTime
      });

      throw new ApiError({
        message: 'Failed to get vehicle valuation: ' + error.message,
        originalError: error
      });
    }

    // Log the complete raw response for debugging
    console.log(`[VALUATION-API][${requestId}] Raw API response:`, data);

    // Calculate data quality score
    const qualityScore = calculateDataQualityScore(data);

    // Track metrics
    ValuationMonitoring.trackValuation({
      vin: cleanVin,
      hasPricingData: !!data?.rawApiResponse,
      usedFallbackValues: false,
      dataQualityScore: qualityScore,
      executionTimeMs: executionTime
    });

    console.log(`[VALUATION-API][${requestId}] Valuation completed successfully in ${executionTime.toFixed(2)}ms`);

    return {
      success: true,
      data,
      error: null
    };
  } catch (error) {
    console.error(`[VALUATION-API][${requestId}] Service error:`, error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error(`[VALUATION-API][${requestId}] Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    
    toast.error('Failed to get vehicle valuation');
    
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in valuation service')
    };
  }
}

function calculateDataQualityScore(data: any): number {
  if (!data?.rawApiResponse) return 0;
  
  try {
    const response = typeof data.rawApiResponse === 'string' 
      ? JSON.parse(data.rawApiResponse) 
      : data.rawApiResponse;
      
    const userParams = response?.functionResponse?.userParams;
    const valuationData = response?.functionResponse?.valuation?.calcValuation;
    
    let score = 0;
    let checks = 0;

    // Check for essential fields
    if (userParams?.make) { score++; checks++; }
    if (userParams?.model) { score++; checks++; }
    if (userParams?.year) { score++; checks++; }
    if (valuationData?.price) { score++; checks++; }
    if (valuationData?.price_med) { score++; checks++; }
    if (valuationData?.price_min) { score++; checks++; }

    return checks > 0 ? score / checks : 0;
  } catch (error) {
    console.error('Error calculating data quality score:', error);
    return 0;
  }
}
