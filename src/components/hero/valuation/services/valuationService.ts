
/**
 * Valuation service for car valuation API calls
 * Updated: 2025-04-25 - Added debug options and enhanced error handling
 */

import { supabase } from "@/integrations/supabase/client";

interface ValuationOptions {
  debug?: boolean;
  requestId?: string;
}

export async function getValuation(
  vin: string, 
  mileage: number, 
  gearbox: string, 
  options: ValuationOptions = {}
) {
  console.log('[ValuationService] Starting valuation for:', { vin, mileage, gearbox });
  console.log('[ValuationService] Options:', options);
  
  try {
    // Make the request with optional debug flags
    const { data, error } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox,
          debug: options.debug || false,
          requestId: options.requestId || undefined
        }
      }
    );

    if (error) {
      console.error('[ValuationService] API error:', error);
      return {
        success: false,
        data: { error: error.message },
        error
      };
    }

    // Verify we have data
    if (!data) {
      console.error('[ValuationService] Empty response');
      return {
        success: false,
        data: { error: 'No data received from valuation service' },
        error: new Error('Empty response from valuation API')
      };
    }

    // Log data fields for debugging
    console.log('[ValuationService] Response data fields:', {
      hasData: !!data,
      fields: Object.keys(data),
      hasMake: !!data.make,
      hasModel: !!data.model,
      hasYear: !!data.year,
      hasPriceMin: data.price_min !== undefined,
      hasPriceMed: data.price_med !== undefined,
      hasValuation: data.valuation !== undefined,
      hasBasePrice: data.basePrice !== undefined,
      hasReservePrice: data.reservePrice !== undefined,
      hasAveragePrice: data.averagePrice !== undefined,
      timestamp: new Date().toISOString()
    });

    // Explicitly log price fields
    if (data) {
      console.log('[ValuationService] Price fields in response:', {
        valuation: data.valuation,
        basePrice: data.basePrice,
        reservePrice: data.reservePrice,
        averagePrice: data.averagePrice,
        price_min: data.price_min,
        price_med: data.price_med
      });
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('[ValuationService] Unexpected error:', error);
    return {
      success: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      error
    };
  }
}
