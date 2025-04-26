
/**
 * Enhanced valuation service with monitoring
 * Updated: 2025-04-26 - Refactored to handle raw API response
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

  try {
    console.log('[VALUATION-API] Getting valuation for:', { vin, mileage, gearbox });
    
    const { data, error } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox
        }
      }
    );
    
    const executionTime = performance.now() - startTime;

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

    // Log the complete raw response for debugging
    console.log('[VALUATION-API] Raw API response:', data);

    // Calculate data quality score
    const qualityScore = calculateDataQualityScore(data);

    // Track metrics
    ValuationMonitoring.trackValuation({
      vin,
      hasPricingData: !!data?.rawApiResponse,
      usedFallbackValues: false,
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
