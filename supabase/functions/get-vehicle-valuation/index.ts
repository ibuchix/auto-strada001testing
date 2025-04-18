/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-18 - Enhanced logging to trace API response and price calculations
 */

import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { isValidVin, isValidMileage } from "./validation.ts";
import { formatSuccessResponse, formatErrorResponse, corsHeaders, 
  calculateValuationChecksum, getSupabaseClient, processValuationData } from "./utils.ts";
import { logOperation } from "./logging.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const { vin, mileage, gearbox } = await req.json();
    
    logOperation('valuation_request_received', { 
      requestId, 
      vin, 
      mileage, 
      gearbox,
      timestamp: new Date().toISOString() 
    });

    // Input validation
    if (!isValidVin(vin)) {
      return formatErrorResponse("Invalid VIN format", 400, "VALIDATION_ERROR");
    }
    
    if (!isValidMileage(mileage)) {
      return formatErrorResponse("Invalid mileage value", 400, "VALIDATION_ERROR");
    }

    const supabase = getSupabaseClient();

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!cacheError && cachedData?.valuation_data) {
      logOperation('using_cached_valuation', { requestId, vin });
      
      // Process cached data to ensure consistent format
      const standardizedData = processValuationData(
        cachedData.valuation_data,
        vin,
        mileage,
        requestId
      );
      
      return formatSuccessResponse(standardizedData);
    }

    // Get API credentials and generate checksum
    const apiId = Deno.env.get("VALUATION_API_ID") || "";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || "";
    
    if (!apiId || !apiSecret) {
      logOperation('missing_api_credentials', { requestId }, 'error');
      return formatErrorResponse(
        "API credentials not configured",
        500,
        "CONFIGURATION_ERROR"
      );
    }

    // Generate checksum for API auth
    const checksum = calculateValuationChecksum(apiId, apiSecret, vin);
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

    logOperation('calling_external_api', {
      requestId,
      vin,
      mileage,
      url: apiUrl
    });

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      logOperation('api_error_response', { 
        requestId,
        status: response.status,
        statusText: response.statusText
      }, 'error');
      
      return formatErrorResponse(
        `API Error: ${response.status} ${response.statusText}`,
        response.status,
        "API_ERROR"
      );
    }

    // Log raw API response
    const rawData = await response.text();
    logOperation('raw_api_response', {
      requestId,
      responseSize: rawData.length,
      rawResponse: rawData.substring(0, 1000), // First 1000 chars for debugging
      timestamp: new Date().toISOString()
    });

    let apiData;
    try {
      apiData = JSON.parse(rawData);
    } catch (parseError) {
      logOperation('parse_error', {
        requestId,
        error: parseError.message,
        rawData: rawData.substring(0, 500)
      }, 'error');
      
      return formatErrorResponse(
        "Failed to parse API response",
        400,
        "PARSE_ERROR"
      );
    }

    // Log all price-related fields
    const priceFields = Object.entries(apiData)
      .filter(([key, value]) => 
        (key.toLowerCase().includes('price') || 
         key.toLowerCase().includes('value') ||
         key.toLowerCase().includes('cost')) &&
        typeof value === 'number'
      );

    logOperation('price_fields_found', {
      requestId,
      priceFields: Object.fromEntries(priceFields),
      timestamp: new Date().toISOString()
    });

    // Calculate base price (average of min and median prices)
    const priceMin = apiData.price_min || apiData.minimum_price || apiData.price || 0;
    const priceMed = apiData.price_med || apiData.median_price || apiData.price || 0;
    const basePrice = (priceMin + priceMed) / 2;

    logOperation('price_calculation', {
      requestId,
      priceMin,
      priceMed,
      basePrice,
      timestamp: new Date().toISOString()
    });

    // Calculate reserve price
    let percentage = 0;
    if (basePrice <= 15000) percentage = 0.65;
    else if (basePrice <= 20000) percentage = 0.46;
    else if (basePrice <= 30000) percentage = 0.37;
    else if (basePrice <= 50000) percentage = 0.27;
    else if (basePrice <= 60000) percentage = 0.27;
    else if (basePrice <= 70000) percentage = 0.22;
    else if (basePrice <= 80000) percentage = 0.23;
    else if (basePrice <= 100000) percentage = 0.24;
    else if (basePrice <= 130000) percentage = 0.20;
    else if (basePrice <= 160000) percentage = 0.185;
    else if (basePrice <= 200000) percentage = 0.22;
    else if (basePrice <= 250000) percentage = 0.17;
    else if (basePrice <= 300000) percentage = 0.18;
    else if (basePrice <= 400000) percentage = 0.18;
    else if (basePrice <= 500000) percentage = 0.16;
    else percentage = 0.145;

    const reservePrice = Math.round(basePrice - (basePrice * percentage));

    logOperation('reserve_price_calculated', {
      requestId,
      basePrice,
      percentage,
      reservePrice,
      formula: `${basePrice} - (${basePrice} × ${percentage})`,
      timestamp: new Date().toISOString()
    });

    // Format the final response
    const result = {
      vin,
      make: apiData.make || '',
      model: apiData.model || '',
      year: apiData.year || apiData.productionYear || new Date().getFullYear(),
      mileage,
      price: basePrice,
      valuation: reservePrice,
      reservePrice,
      averagePrice: basePrice
    };

    logOperation('final_result', {
      requestId,
      result,
      timestamp: new Date().toISOString()
    });

    return formatSuccessResponse(result);

  } catch (error) {
    logOperation('unhandled_error', {
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatErrorResponse(
      `Error processing valuation request: ${error.message}`,
      500,
      "INTERNAL_ERROR"
    );
  }
});
