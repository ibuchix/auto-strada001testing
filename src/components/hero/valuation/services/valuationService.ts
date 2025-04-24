
/**
 * Valuation service for car valuation API calls
 * Updated: 2025-04-25 - Added debug options and enhanced error handling
 * Updated: 2025-04-28 - Added cleanupValuationData function
 * Updated: 2025-04-28 - Enhanced logging for API response debugging
 * Updated: 2025-04-29 - ADDED HIGHLY VISIBLE CONSOLE LOGGING FOR DEBUGGING
 * Updated: 2025-04-30 - Improved API response processing and price extraction
 * Updated: 2025-04-30 - Fixed type compatibility with PriceData
 * Updated: 2025-05-01 - Added detailed API response inspection
 */

import { supabase } from "@/integrations/supabase/client";
import { extractPriceData, deepScanForPrices } from "@/utils/valuation/priceExtractor";
import { calculateReservePrice } from "@/utils/priceUtils";
import { inspectApiResponse } from "@/utils/valuation/apiResponseInspector";

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
          debug: true, // Always enable debug for troubleshooting
          requestId,
          includeRawResponse: true // Ask for the raw response to be included
        }
      }
    );

    // Log the raw response with clear visibility
    console.log('%c📊 RAW SUPABASE RESPONSE:', 'background: #4CAF50; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
    console.dir(data);
    console.log('%c📝 RAW RESPONSE JSON:', 'color: #2196F3; font-weight: bold');
    console.log(JSON.stringify(data, null, 2));
    
    // Use our inspector utility to analyze the response
    inspectApiResponse(data, 'VALUATION-SERVICE');
    
    // Check for error in the Edge Function response
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
        data: { 
          error: data.error, 
          vin,
          transmission: gearbox
        },
        error: new Error(data.error)
      };
    }

    // Check if rawApiResponse was included
    if (data.rawApiResponse) {
      console.log('%c🔍 RAW API RESPONSE FROM EXTERNAL SERVICE:', 'background: #9C27B0; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
      console.log(data.rawApiResponse);
      
      // Inspect the raw API response
      inspectApiResponse(data.rawApiResponse, 'EXTERNAL-API');
    }

    // Enhanced price data extraction
    const priceData = extractPriceData(data);
    
    if (priceData === null) {
      console.error('%c❌ FAILED TO EXTRACT PRICE DATA', 'background: #FF5252; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
      
      // Deep scan for any price fields to help debug
      const priceFields = deepScanForPrices(data);
      console.log('Price fields found anywhere in the response:', priceFields);
      
      return {
        success: false,
        data: { 
          error: 'Could not extract valid price data from the API response',
          vin,
          transmission: gearbox 
        },
        error: new Error('Price data extraction failed')
      };
    }

    // Calculate reserve price if not already set
    const reservePrice = priceData.reservePrice || calculateReservePrice(priceData.basePrice);
    
    // Prepare enhanced response with extracted prices
    const enhancedResponse = {
      ...data,
      // Make sure price fields are present 
      reservePrice: reservePrice,
      valuation: priceData.valuation || priceData.basePrice,
      basePrice: priceData.basePrice,
      averagePrice: priceData.averagePrice || priceData.price_med,
      // Add estimation metadata
      usingFallbackEstimation: data.usingFallbackEstimation || false,
      estimationMethod: data.estimationMethod || 'calcValuation'
    };
    
    // Check for valid vehicle data
    const hasValidVehicleData = enhancedResponse.make && enhancedResponse.model && enhancedResponse.year;
    if (!hasValidVehicleData) {
      console.warn('%c⚠️ MISSING VEHICLE DATA:', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        make: enhancedResponse.make || 'MISSING',
        model: enhancedResponse.model || 'MISSING',
        year: enhancedResponse.year || 'MISSING'
      });
    }
    
    // Check for valid price data
    const hasValidPriceData = enhancedResponse.reservePrice > 0 || enhancedResponse.valuation > 0 || enhancedResponse.basePrice > 0;
    if (!hasValidPriceData) {
      console.warn('%c⚠️ MISSING PRICE DATA:', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        reservePrice: enhancedResponse.reservePrice,
        valuation: enhancedResponse.valuation,
        basePrice: enhancedResponse.basePrice
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
    console.log('%c📝 ENHANCED RESPONSE:', 'font-weight: bold; color: #4CAF50');
    console.table({
      make: enhancedResponse.make,
      model: enhancedResponse.model,
      year: enhancedResponse.year,
      basePrice: enhancedResponse.basePrice,
      reservePrice: enhancedResponse.reservePrice,
      averagePrice: enhancedResponse.averagePrice,
      valuation: enhancedResponse.valuation,
      usingFallbackEstimation: enhancedResponse.usingFallbackEstimation
    });

    return {
      success: true,
      data: enhancedResponse
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
