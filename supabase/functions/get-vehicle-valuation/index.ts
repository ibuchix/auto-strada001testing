
/**
 * Edge function for vehicle valuation
 * Updated: 2025-04-25 - Enhanced price data extraction and error handling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { callValuationApi } from "./utils/api-service.ts";
import { processValuationData } from "./utils/data-processor.ts";
import { calculateReservePrice } from "./utils/price-calculator.ts";
import { logOperation } from "./utils/logging.ts";

serve(async (req) => {
  // Handle CORS if needed
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID().substring(0, 8);
    
    // Parse request data
    const { vin, mileage, gearbox, debug } = await req.json();
    
    if (!vin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing VIN parameter'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    logOperation('request_received', {
      requestId,
      vin,
      mileage,
      gearbox,
      debug: !!debug
    });
    
    // Call external valuation API
    const apiResponse = await callValuationApi(vin, mileage, requestId);
    
    // Log the raw API response for debugging
    logOperation('api_response_received', {
      requestId,
      success: apiResponse.success,
      hasData: !!apiResponse.data,
      error: apiResponse.error || null,
      responseSize: apiResponse.data ? JSON.stringify(apiResponse.data).length : 0
    });
    
    if (!apiResponse.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: apiResponse.error || 'Failed to get valuation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process the raw valuation data
    const rawData = apiResponse.data;
    
    // IMPORTANT: Log the complete raw data for debugging price extraction issues
    logOperation('raw_valuation_data', {
      requestId,
      dataKeys: Object.keys(rawData),
      hasPriceFields: !!(rawData.price_min || rawData.price_med),
      hasNestedFunctionResponse: !!rawData.functionResponse,
      rawData: debug ? JSON.stringify(rawData) : '[omitted]' // Only include raw data in debug mode
    });
    
    // Extract pricing data from nested structure if present
    let extractedPriceMin = 0;
    let extractedPriceMed = 0;
    
    // Try to extract from functionResponse.valuation.calcValuation (common API structure)
    if (rawData.functionResponse?.valuation?.calcValuation) {
      const calcValuation = rawData.functionResponse.valuation.calcValuation;
      
      logOperation('found_nested_calcvaluation', {
        requestId,
        calcValuationKeys: Object.keys(calcValuation)
      });
      
      if (calcValuation.price_min !== undefined) {
        extractedPriceMin = Number(calcValuation.price_min);
      }
      
      if (calcValuation.price_med !== undefined) {
        extractedPriceMed = Number(calcValuation.price_med);
      }
    }
    
    // If not found in nested structure, check root level
    if (extractedPriceMin === 0 && rawData.price_min !== undefined) {
      extractedPriceMin = Number(rawData.price_min);
    }
    
    if (extractedPriceMed === 0 && rawData.price_med !== undefined) {
      extractedPriceMed = Number(rawData.price_med);
    }
    
    logOperation('extracted_price_data', {
      requestId,
      extractedPriceMin,
      extractedPriceMed
    });
    
    // Process the data to extract vehicle info and calculate prices
    const processedData = processValuationData(rawData, vin, mileage, requestId);
    
    // Override with extracted price data if we found it
    if (extractedPriceMin > 0 && extractedPriceMed > 0) {
      processedData.price_min = extractedPriceMin;
      processedData.price_med = extractedPriceMed;
      
      // Calculate basePrice as average of min and med prices
      const basePrice = (extractedPriceMin + extractedPriceMed) / 2;
      processedData.basePrice = basePrice;
      processedData.valuation = basePrice;
      
      // Calculate reserve price using pricing tiers
      processedData.reservePrice = calculateReservePrice(basePrice, requestId);
      processedData.averagePrice = extractedPriceMed;
    }
    
    logOperation('processing_complete', {
      requestId,
      make: processedData.make,
      model: processedData.model,
      year: processedData.year,
      hasPriceData: processedData.basePrice > 0,
      basePrice: processedData.basePrice,
      reservePrice: processedData.reservePrice
    });
    
    // Prepare the response
    return new Response(
      JSON.stringify({
        ...processedData,
        apiSource: processedData.basePrice > 0 ? 'auto_iso' : 'estimation',
        usingFallbackEstimation: processedData.basePrice === 0,
        debug: debug ? {
          requestId,
          extractedPriceMin,
          extractedPriceMed,
          rawDataKeys: Object.keys(rawData)
        } : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in valuation function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
