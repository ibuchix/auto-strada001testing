
/**
 * Enhanced valuation service with monitoring
 * Updated: 2025-04-19 - Added monitoring integration
 * Updated: 2025-04-25 - Enhanced API response logging to debug price data issues
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
  let usedFallback = false;

  try {
    console.log('[VALUATION-API] Getting valuation for:', { vin, mileage, gearbox });
    
    // Track request for debugging
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[VALUATION-API] Request ID: ${requestId}`);
    
    const { data, error } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox,
          debug: true, // Enable debug mode for more verbose logging
          requestId
        }
      }
    );
    
    const executionTime = performance.now() - startTime;

    // Log complete raw response for debugging
    console.log('[VALUATION-API] Raw API response:', JSON.stringify(data, null, 2));
    
    if (error) {
      console.error('[VALUATION-API] Error:', error);
      
      ValuationMonitoring.trackValuation({
        vin,
        hasPricingData: false,
        usedFallbackValues: false,
        dataQualityScore: 0,
        executionTimeMs: executionTime
      });

      throw new ApiError({
        message: 'Failed to get vehicle valuation',
        originalError: error
      });
    }

    // More detailed API response inspection
    console.log('[VALUATION-API] Response structure:', {
      hasData: !!data,
      topLevelKeys: data ? Object.keys(data) : [],
      hasPriceMin: data?.price_min !== undefined,
      hasPriceMed: data?.price_med !== undefined,
      hasValuation: data?.valuation !== undefined,
      hasReservePrice: data?.reservePrice !== undefined,
      hasNestedFunctionResponse: !!data?.functionResponse,
      hasNestedCalcValuation: !!data?.functionResponse?.valuation?.calcValuation
    });

    // If we have nested function response, check for price data
    if (data?.functionResponse?.valuation?.calcValuation) {
      console.log('[VALUATION-API] Nested calcValuation found:', 
        data.functionResponse.valuation.calcValuation);
    }

    // Calculate data quality score
    const qualityScore = calculateDataQualityScore(data);
    usedFallback = checkForFallbackUsage(data);

    // Track metrics
    ValuationMonitoring.trackValuation({
      vin,
      hasPricingData: !!data?.valuation || !!data?.price_med,
      usedFallbackValues: usedFallback,
      dataQualityScore: qualityScore,
      executionTimeMs: executionTime
    });

    return { data, error: null };
  } catch (error) {
    console.error('[VALUATION-API] Service error:', error);
    toast.error('Failed to get vehicle valuation');
    
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in valuation service')
    };
  }
}

function calculateDataQualityScore(data: any): number {
  if (!data) return 0;

  let score = 0;
  let checks = 0;

  // Check for essential fields
  if (data.make) { score++; checks++; }
  if (data.model) { score++; checks++; }
  if (data.year) { score++; checks++; }
  if (data.valuation || data.price_med) { score++; checks++; }
  if (data.transmission) { score++; checks++; }

  // Price data quality
  if (data.price_min && data.price_med) {
    score += 2;
    checks += 2;
  }

  return checks > 0 ? score / checks : 0;
}

function checkForFallbackUsage(data: any): boolean {
  if (!data) return true;
  
  // Check if we're using any fallback values
  return !data.price_min || 
         !data.price_med || 
         data.usedDefaultPrice || 
         data.valuation === 30000; // Default fallback value
}
