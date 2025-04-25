
/**
 * Edge function for vehicle valuation
 * Updated: 2025-05-05 - Complete rewrite of JSON parsing and error handling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { callValuationApi } from "./utils/api-service.ts";
import { processValuationData } from "./utils/data-processor.ts";
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
    const requestJson = await req.json();
    const { vin, mileage, gearbox = 'manual' } = requestJson;
    
    // Log received parameters
    logOperation('valuation_request_received', {
      requestId,
      vin,
      mileage,
      gearbox
    });
    
    if (!vin) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing VIN parameter'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get API credentials
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    
    if (!apiSecret) {
      logOperation('missing_api_credentials', { requestId }, 'error');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'API credentials not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Call external valuation API
    logOperation('calling_external_api', { requestId, vin, mileage });
    const apiResponse = await callValuationApi(vin, mileage, apiId, apiSecret, requestId);
    
    if (!apiResponse.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: apiResponse.error || 'Failed to get valuation'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log the raw API response for debugging
    logOperation('raw_response_received', {
      requestId,
      responseSize: apiResponse.rawResponse ? apiResponse.rawResponse.length : 0,
      hasData: !!apiResponse.data
    });
    
    // Process the valuation data from the raw response
    try {
      // Process the raw API response
      const processedData = processValuationData(apiResponse.rawResponse, vin, mileage, requestId);
      
      // Return the processed data
      return new Response(
        JSON.stringify(processedData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (processingError) {
      logOperation('processing_error', {
        requestId,
        error: processingError.message
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          error: processingError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
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
