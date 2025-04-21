
/**
 * Edge function for retrieving vehicle valuation data
 * Updated: 2025-04-22 - Improved price data extraction and response structure
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./utils/cors.ts";
import { validateRequest } from "./utils/validation.ts";
import { processValuationData } from "./utils/data-processor.ts";
import { calculateReservePrice } from "./utils/price-calculator.ts";
import { callExternalValuationAPI } from "./utils/api-client.ts";
import { logOperation } from "./utils/logging.ts";

serve(async (req) => {
  // Generate a unique request ID for tracking
  const requestId = crypto.randomUUID();
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Parse and validate request data
    const { data, error } = await validateRequest(req);
    
    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const { vin, mileage, gearbox } = data;
    
    logOperation('valuation_request', { 
      requestId, 
      vin, 
      mileage 
    });
    
    // Call external valuation API
    const valuation = await callExternalValuationAPI(vin, mileage, requestId);
    
    if (!valuation || valuation.error) {
      throw new Error(valuation?.error || 'Failed to retrieve valuation data');
    }
    
    // Process the valuation data
    const processedData = processValuationData(valuation, vin, mileage, requestId);
    
    // Add essential fields
    processedData.vin = vin;
    processedData.mileage = mileage;
    processedData.transmission = gearbox;
    
    // Ensure the valuation amounts are set
    if (!processedData.valuation || processedData.valuation <= 0) {
      if (processedData.averagePrice > 0) {
        processedData.valuation = processedData.averagePrice;
      } else if (processedData.basePrice > 0) {
        processedData.valuation = processedData.basePrice;
      }
    }
    
    // Ensure reserve price is calculated
    if (!processedData.reservePrice || processedData.reservePrice <= 0) {
      const basePrice = processedData.basePrice || processedData.valuation || 0;
      processedData.reservePrice = calculateReservePrice(basePrice, requestId);
    }
    
    logOperation('valuation_response', { 
      requestId, 
      hasPrice: !!processedData.valuation,
      make: processedData.make,
      model: processedData.model
    });
    
    // Return successful response
    return new Response(
      JSON.stringify({ success: true, data: processedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Log and return error response
    logOperation('valuation_error', { 
      requestId, 
      error: error.message 
    }, 'error');
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
