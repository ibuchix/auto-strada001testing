
/**
 * Enhanced valuation service with monitoring
 * Updated: 2025-04-19 - Added monitoring integration
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
    console.log('Getting valuation for:', { vin, mileage, gearbox });
    
    const { data, error } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: { vin, mileage, gearbox }
      }
    );
    
    const executionTime = performance.now() - startTime;

    if (error) {
      console.error('Valuation API error:', error);
      
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
    console.error('Valuation service error:', error);
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
