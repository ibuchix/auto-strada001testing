
/**
 * Edge function for handling car listing valuation requests
 * Updated: 2025-04-19 - Refactored to use modular utility files
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { 
  corsHeaders, 
  handleCorsOptions,
  logOperation,
  validateRequest,
  formatSuccessResponse,
  formatErrorResponse,
  callValuationApi,
  calculateReservePrice,
  storeSearchResult,
  createRequestId
} from './utils/index.ts';
import { ValuationRequest, ValuationResponse } from './types.ts';

serve(async (req) => {
  // Generate request ID for tracking
  const requestId = createRequestId();
  logOperation('request_received', { requestId, method: req.method, url: req.url }, 'info');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    // Parse request data
    const requestData = await req.json();
    logOperation('request_parsed', { requestId, body: requestData }, 'debug');
    
    // Validate request data
    const { vin, mileage, gearbox } = requestData as ValuationRequest;
    logOperation('request_data', { requestId, vin, mileage, gearbox }, 'debug');

    const validation = validateRequest(requestData);
    if (!validation.valid) {
      logOperation('validation_error', { requestId, error: validation.error }, 'error');
      throw new Error(validation.error);
    }

    // Get API credentials from environment variables
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiSecret) {
      logOperation('missing_api_credentials', { requestId }, 'error');
      throw new Error('Missing API secret key');
    }

    // Call the valuation API
    const valuationData = await callValuationApi(vin, mileage, apiId, apiSecret, requestId);
    
    // Check if the API returned valid data
    if (!valuationData) {
      logOperation('empty_response', { requestId }, 'error');
      throw new Error('Empty response from valuation API');
    }
    
    // Check if the API returned an error
    if (valuationData.error) {
      logOperation('api_returned_error', { 
        requestId, 
        error: valuationData.error 
      }, 'error');
      throw new Error(valuationData.error || 'Failed to get valuation');
    }
    
    // Verify we have some kind of data
    if (Object.keys(valuationData).length < 3) {
      logOperation('insufficient_data', { 
        requestId, 
        dataLength: Object.keys(valuationData).length 
      }, 'error');
      throw new Error('Insufficient data returned from valuation API');
    }
  
    // Store the search result for analytics
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const userId = req.headers.get('authorization')?.split('Bearer ')[1] || null;
    
    await storeSearchResult(
      supabaseUrl || '',
      supabaseServiceKey || '',
      vin,
      valuationData,
      userId,
      requestId
    );
    
    // Extract make, model, year with fallbacks
    const make = valuationData.make || valuationData.manufacturer || null;
    const model = valuationData.model || valuationData.modelName || null;
    const year = valuationData.year || valuationData.productionYear || null;
    
    // Calculate valuation
    let valuation = valuationData.valuation || 
                   valuationData.price_med || 
                   (valuationData.price_min + valuationData.price_max) / 2 || 
                   null;
                   
    if (!valuation && !make && !model) {
      logOperation('critical_data_missing', { requestId }, 'error');
      throw new Error('No vehicle data found for this VIN');
    }
    
    // Calculate reserve price
    let reservePrice;
    if (valuation) {
      reservePrice = calculateReservePrice(valuation);
      logOperation('reserve_price_calculated', { 
        requestId, 
        valuation, 
        reservePrice 
      }, 'debug');
    }
    
    // Prepare response data
    const responseData: ValuationResponse = {
      make,
      model,
      year,
      vin,
      mileage,
      valuation,
      reservePrice: reservePrice || valuation,
      averagePrice: valuationData.price_med || valuation,
      transmission: gearbox,
      // Include raw data for diagnostic purposes
      apiData: {
        dataSize: JSON.stringify(valuationData).length,
        fields: Object.keys(valuationData)
      }
    };
    
    logOperation('response_prepared', { 
      requestId, 
      responseSize: JSON.stringify(responseData).length 
    }, 'debug');
    
    return formatSuccessResponse(responseData);
  } catch (error) {
    logOperation('request_error', { 
      requestId, 
      error: (error as Error).message,
      stack: (error as Error).stack
    }, 'error');
    
    return formatErrorResponse(error as Error);
  }
});
