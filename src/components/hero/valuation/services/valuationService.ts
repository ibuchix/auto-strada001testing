
/**
 * Valuation service for car valuation API calls
 * Updated: 2025-04-25 - Added debug options and enhanced error handling
 * Updated: 2025-04-28 - Added cleanupValuationData function
 * Updated: 2025-04-28 - Enhanced logging for API response debugging
 * Updated: 2025-04-29 - ADDED HIGHLY VISIBLE CONSOLE LOGGING FOR DEBUGGING
 */

import { supabase } from "@/integrations/supabase/client";

interface ValuationOptions {
  debug?: boolean;
  requestId?: string;
}

/**
 * Cleanup all valuation-related data
 */
export function cleanupValuationData(): void {
  // Clear valuation-related localStorage items
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('valuationTimestamp');
  
  console.log('[ValuationService] Cleaned up valuation data');
}

export async function getValuation(
  vin: string, 
  mileage: number, 
  gearbox: string, 
  options: ValuationOptions = {}
) {
  console.log('%c🚗 VALUATION REQUEST STARTED', 'background: #ffcc00; color: #000; font-size: 14px; padding: 4px 8px; border-radius: 4px');
  console.log('%c📝 Input Parameters:', 'font-weight: bold; color: #0066cc');
  console.table({ vin, mileage, gearbox, debug: options.debug || true });
  
  // Generate a unique request ID for tracing
  const requestId = options.requestId || `val-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    console.log('%c📡 Calling Supabase Function...', 'color: #6a0dad; font-weight: bold');
    
    // Make the request with optional debug flags
    const { data, error } = await supabase.functions.invoke(
      'get-vehicle-valuation',
      {
        body: { 
          vin, 
          mileage, 
          gearbox,
          debug: options.debug || true, // Always enable debug for troubleshooting
          requestId
        }
      }
    );

    // Log the raw response with clear visibility
    console.log('%c📊 RAW SUPABASE RESPONSE:', 'background: #4CAF50; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
    console.dir(data);
    console.log('%c📝 RAW RESPONSE JSON:', 'color: #2196F3; font-weight: bold');
    console.log(JSON.stringify(data, null, 2));
    
    // Log response structure with clear formatting
    console.log('%c🔍 RESPONSE STRUCTURE ANALYSIS:', 'background: #9C27B0; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
    console.table({
      hasData: !!data,
      isObject: typeof data === 'object',
      topLevelKeys: data ? Object.keys(data) : [],
      hasMake: data?.make ? 'yes' : 'no',
      hasModel: data?.model ? 'yes' : 'no',
      hasYear: data?.year ? 'yes' : 'no',
      hasPriceFields: !!(data?.price_min || data?.price_med || data?.basePrice),
      hasReservePrice: data?.reservePrice ? 'yes' : 'no',
      hasValuation: data?.valuation ? 'yes' : 'no',
      errorPresent: data?.error ? 'yes' : 'no',
      apiSource: data?.apiSource || 'unknown',
      usingFallback: data?.usingFallbackEstimation ? 'yes' : 'no'
    });

    if (error) {
      console.error('%c❌ API ERROR:', 'background: #FF5252; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', error);
      return {
        success: false,
        data: { error: error.message },
        error
      };
    }

    // Verify we have data
    if (!data) {
      console.error('%c❌ EMPTY RESPONSE', 'background: #FF5252; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
      return {
        success: false,
        data: { error: 'No data received from valuation service' },
        error: new Error('Empty response from valuation API')
      };
    }

    // Check for API-specific errors
    if (data.error) {
      console.error('%c❌ API RETURNED ERROR:', 'background: #FF5252; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', data.error);
      return {
        success: false,
        data: { error: data.error },
        error: new Error(data.error)
      };
    }

    // Log specific price data fields for debugging
    console.log('%c💰 PRICE DATA CHECK:', 'background: #2196F3; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
    console.table({
      valuation: data.valuation,
      basePrice: data.basePrice, 
      reservePrice: data.reservePrice,
      averagePrice: data.averagePrice,
      price_min: data.price_min,
      price_med: data.price_med,
      apiSource: data.apiSource,
      usingFallbackEstimation: data.usingFallbackEstimation
    });
    
    // Check for valid vehicle data
    const hasValidVehicleData = data.make && data.model && data.year;
    if (!hasValidVehicleData) {
      console.warn('%c⚠️ MISSING VEHICLE DATA:', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        make: data.make || 'MISSING',
        model: data.model || 'MISSING',
        year: data.year || 'MISSING'
      });
    }
    
    // Check for valid price data
    const hasValidPriceData = data.reservePrice > 0 || data.valuation > 0 || data.basePrice > 0;
    if (!hasValidPriceData) {
      console.warn('%c⚠️ MISSING PRICE DATA:', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        reservePrice: data.reservePrice,
        valuation: data.valuation,
        basePrice: data.basePrice
      });
    }

    // Before returning, store critical values in localStorage for debugging
    try {
      localStorage.setItem('lastValuationResponse', JSON.stringify({
        timestamp: new Date().toISOString(),
        vin,
        mileage,
        gearbox,
        hasData: !!data,
        hasVehicleData: hasValidVehicleData,
        hasPriceData: hasValidPriceData,
        requestId
      }));
    } catch (e) {
      console.warn('[ValuationService] Failed to store debug data:', e);
    }

    console.log('%c✅ VALUATION REQUEST COMPLETED SUCCESSFULLY', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('%c❌ UNEXPECTED ERROR:', 'background: #FF5252; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', error);
    return {
      success: false,
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      error
    };
  }
}
