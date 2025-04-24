/**
 * Edge function for vehicle valuation
 * Updated: 2025-04-25 - Enhanced price data extraction and error handling
 * Updated: 2025-04-28 - Added extensive debugging and response validation
 * Updated: 2025-05-01 - Added raw API response inclusion for debugging
 * Updated: 2025-04-24 - Removed all caching functionality
 * Updated: 2025-04-24 - Fixed remaining cache references causing "using_cached_valuation" logs
 * Updated: 2025-04-24 - Added enhanced environment variable debugging
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { callValuationApi } from "./utils/api-service.ts";
import { processValuationData } from "./utils/data-processor.ts";
import { logOperation } from "./utils/logging.ts";
import { checkApiCredentials, debugApiEndpoint } from "./utils/debug-helper.ts";

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
    logOperation('request_received', {
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
      envVarNames: Object.keys(Deno.env.toObject()).join(',')
    });
    
    if (!credentialCheck.valid) {
      logOperation('api_credentials_invalid', { 
        requestId,
        details: credentialCheck.details
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API credentials are not properly configured',
          apiSource: 'estimation',
          usingFallbackEstimation: true,
          make: '',
          model: '',
          year: 0,
          credentialDetails: credentialCheck.details
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get API credentials
    const apiId = Deno.env.get('CAR_API_ID') || Deno.env.get('VALUATION_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET') || Deno.env.get('VALUATION_API_SECRET');
    
    if (!apiSecret) {
      logOperation('missing_api_secret', { 
        requestId,
        availableEnvVars: Object.keys(Deno.env.toObject())
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API secret key is missing',
          availableEnvVars: Object.keys(Deno.env.toObject())
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Debug the API endpoint that will be called
    debugApiEndpoint(vin, mileage, requestId);
    
    // Call external valuation API directly - ALWAYS fetch fresh data
    logOperation('calling_external_api', { requestId, vin, mileage });
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
      responseSize: apiResponse.data ? JSON.stringify(apiResponse.data).length : 0
    });
    
    // CRITICAL: Log the entire raw response for debugging
    if (debug) {
      logOperation('api_raw_response', {
        requestId,
        data: JSON.stringify(apiResponse.data)
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
    
    // Process the raw valuation data with detailed logging
    const rawData = apiResponse.data;
    
    // Log raw data structure
    logOperation('raw_data_structure', {
      requestId,
      hasData: !!rawData,
      topLevelKeys: rawData ? Object.keys(rawData) : [],
      hasFunctionResponse: !!rawData?.functionResponse,
      hasNestedValuation: !!rawData?.functionResponse?.valuation,
      hasCalcValuation: !!rawData?.functionResponse?.valuation?.calcValuation
    });
    
    // Extract detailed data structure for debugging
    const functionResponse = rawData?.functionResponse || {};
    const userParams = functionResponse.userParams || {};
    const calcValuation = functionResponse.valuation?.calcValuation || {};
    
    logOperation('data_extraction_check', {
      requestId,
      userParamsFields: Object.keys(userParams),
      calcValuationFields: Object.keys(calcValuation),
      hasUserParamsMake: !!userParams.make,
      hasUserParamsModel: !!userParams.model,
      hasCalcValuationPriceMin: calcValuation.price_min !== undefined,
      hasCalcValuationPriceMed: calcValuation.price_med !== undefined
    });
    
    // Process the data with enhanced validation
    const processedData = processValuationData(rawData, vin, mileage, requestId);
    
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
      usingFallbackEstimation: processedData.basePrice === 0,
      gearbox: gearbox || processedData.transmission || 'manual',
      // Include the original API response if requested
      rawApiResponse: includeRawResponse ? apiResponse.rawResponse : undefined,
      debug: debug ? {
        requestId,
        timestamp: new Date().toISOString(),
        originalDataKeys: Object.keys(rawData || {}),
        extractedDataKeys: Object.keys(processedData || {})
      } : undefined
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
