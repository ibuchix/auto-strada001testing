
/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-18 - Enhanced data extraction, standardized property mapping,
 * and comprehensive validation
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
    logOperation('valuation_request_received', { requestId, vin, mileage, gearbox });
    
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
    
    const checksum = calculateValuationChecksum(apiId, apiSecret, vin);
    
    // Call external API
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    logOperation('calling_external_api', { requestId, vin, apiUrl });
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      logOperation('api_error_response', { 
        requestId,
        status: response.status,
        statusText: response.statusText
      }, 'error');
      
      return formatErrorResponse(
        `API responded with status: ${response.status}`,
        response.status,
        "API_ERROR"
      );
    }
    
    const rawData = await response.json();
    
    if (!rawData) {
      logOperation('empty_api_response', { requestId }, 'error');
      return formatErrorResponse(
        "Empty response from valuation API",
        400,
        "EMPTY_RESPONSE"
      );
    }

    // Process and standardize the API response
    const valuationData = processValuationData(rawData, vin, mileage, requestId);
    
    // Save to cache regardless of data completeness
    try {
      const { error: insertError } = await supabase
        .from('vin_valuation_cache')
        .insert({
          vin,
          mileage,
          valuation_data: {
            ...rawData,
            processedAt: new Date().toISOString(),
            standardized: valuationData
          }
        });

      if (insertError) {
        logOperation('cache_insert_error', { 
          requestId,
          error: insertError.message 
        }, 'error');
      }
    } catch (cacheError) {
      logOperation('cache_error', {
        requestId,
        error: cacheError.message
      }, 'warn');
    }

    return formatSuccessResponse(valuationData);

  } catch (error) {
    logOperation('valuation_error', { 
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
