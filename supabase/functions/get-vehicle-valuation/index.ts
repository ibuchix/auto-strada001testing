
/**
 * Edge function for vehicle valuation
 * Updated: 2025-04-25 - Fixed JSON parsing of nested API response
 * Updated: 2025-04-25 - Enhanced price data extraction and error handling
 * Updated: 2025-04-28 - Added extensive debugging and response validation
 * Updated: 2025-05-01 - Added raw API response inclusion for debugging
 * Updated: 2025-04-24 - Removed all caching functionality
 * Updated: 2025-04-24 - Fixed remaining cache references causing "using_cached_valuation" logs
 * Updated: 2025-04-24 - Added enhanced environment variable debugging
 * Updated: 2025-04-24 - Added fallback mechanism for API credentials
 * Updated: 2025-04-24 - Fixed raw API response processing and data extraction from nested structure
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { callValuationApi } from "./utils/api-service.ts";
import { processValuationData } from "./utils/data-processor.ts";
import { logOperation } from "./utils/logging.ts";
import { checkApiCredentials, getApiCredentials, debugApiEndpoint } from "./utils/debug-helper.ts";

serve(async (req) => {
  // Handle CORS if needed
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Generate request ID for tracking
    const requestId = crypto.randomUUID().substring(0, 8);
    
    // Parse request data
    const requestJson = await req.json();
    const { vin, mileage, gearbox, debug = true, includeRawResponse = true } = requestJson;
    
    // Log received parameters
    logOperation('valuation_request_received', {
      requestId,
      vin,
      mileage,
      gearbox,
      debug,
      includeRawResponse,
      timestamp: new Date().toISOString()
    });
    
    if (!vin) {
      logOperation('missing_vin', { requestId }, 'error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing VIN parameter'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Enhanced environment variable checking with detailed logging
    const credentialCheck = checkApiCredentials(requestId);
    logOperation('credential_check', {
      requestId,
      valid: credentialCheck.valid,
      ...credentialCheck.details,
    });
    
    // Get API credentials with our enhanced helper function
    const { apiId, apiSecret } = getApiCredentials();
    
    // Debug the API endpoint that will be called
    debugApiEndpoint(vin, mileage, requestId);
    
    // Call external valuation API directly - ALWAYS fetch fresh data
    logOperation('calling_external_api', { 
      requestId, 
      vin, 
      mileage,
      url: `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:calculatedhash/vin:${vin}/odometer:${mileage}/currency:PLN` 
    });
    
    const apiResponseStart = performance.now();
    const apiResponse = await callValuationApi(vin, mileage, apiId, apiSecret, requestId);
    const apiResponseTime = performance.now() - apiResponseStart;
    
    // Log API response details
    logOperation('api_response_received', {
      requestId,
      timeMs: apiResponseTime.toFixed(2),
      success: apiResponse.success,
      hasData: !!apiResponse.data,
      error: apiResponse.error || null,
      responseSize: apiResponse.rawResponse ? apiResponse.rawResponse.length : 0
    });
    
    // CRITICAL: Log the entire raw response for debugging
    if (debug && apiResponse.rawResponse) {
      logOperation('raw_api_response', {
        requestId,
        responseSize: apiResponse.rawResponse.length,
        rawResponse: apiResponse.rawResponse
      });
    }
    
    if (!apiResponse.success) {
      logOperation('api_error', { 
        requestId, 
        error: apiResponse.error 
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: apiResponse.error || 'Failed to get valuation',
          apiSource: 'error',
          errorDetails: apiResponse.error,
          // Include the raw response even on error if requested
          rawApiResponse: includeRawResponse ? apiResponse.rawResponse : undefined
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if we have a valid data object or just a raw response string
    let dataToProcess = apiResponse.data;
    
    // If we're getting object with no price data but with raw response, try to parse that
    if ((!dataToProcess || !dataToProcess.functionResponse) && apiResponse.rawResponse) {
      try {
        // Try to use the raw response directly
        logOperation('using_raw_response', { 
          requestId, 
          reason: 'Missing functionResponse in data object' 
        });
        dataToProcess = apiResponse.rawResponse;
      } catch (err) {
        logOperation('raw_parsing_error', { 
          requestId, 
          error: err.message 
        }, 'error');
      }
    }
    
    // Process the raw valuation data with detailed logging
    const processedData = processValuationData(dataToProcess, vin, mileage, requestId);
    
    // Log the processed data for debugging
    logOperation('processed_data', {
      requestId,
      make: processedData.make,
      model: processedData.model,
      year: processedData.year,
      basePrice: processedData.basePrice,
      reservePrice: processedData.reservePrice,
      valuation: processedData.valuation,
      apiSource: processedData.basePrice > 0 ? 'auto_iso' : 'estimation'
    });
    
    // Final response generation
    const finalResponse = {
      ...processedData,
      apiSource: processedData.basePrice > 0 ? 'auto_iso' : 'estimation',
      usingFallbackEstimation: processedData.basePrice === 0 || processedData.usingFallbackEstimation,
      gearbox: gearbox || processedData.transmission || 'manual',
      // Include the original API response if requested
      rawApiResponse: includeRawResponse ? apiResponse.rawResponse : undefined
    };
    
    // Log what we're about to send back
    logOperation('sending_response', {
      requestId,
      responseSize: JSON.stringify(finalResponse).length,
      hasMake: !!finalResponse.make,
      hasModel: !!finalResponse.model,
      hasYear: !!finalResponse.year,
      hasPrices: finalResponse.basePrice > 0 || finalResponse.reservePrice > 0,
      usingFallback: finalResponse.usingFallbackEstimation,
      includesRawResponse: includeRawResponse
    });
    
    return new Response(
      JSON.stringify(finalResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error.message || 'Internal server error';
    console.error('Error in valuation function:', error);
    
    // Send detailed error response
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        errorStack: error.stack,
        errorType: error.name,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
