
/**
 * Vehicle Valuation Edge Function
 * Updated: 2025-04-19 - Refactored to use organized utilities directory structure
 */

import { serve } from "https://deno.land/std@0.217.0/http/server.ts";
import { 
  corsHeaders, 
  handleCorsOptions,
  formatSuccessResponse, 
  formatErrorResponse, 
  formatServerErrorResponse,
  isValidVin,
  isValidMileage,
  logOperation,
  createPerformanceTracker,
  checkCache,
  storeInCache,
  callValuationApi,
  processValuationData
} from "./utils/index.ts";
import type { ValuationRequest, ValuationData } from "./types.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  try {
    // Generate request ID for tracing
    const requestId = crypto.randomUUID();
    const perfTracker = createPerformanceTracker(requestId, 'valuation_request');
    
    // Parse request
    let requestData: ValuationRequest;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      logOperation('invalid_json', { 
        requestId, 
        error: jsonError.message 
      }, 'error');
      
      return formatErrorResponse(
        "Invalid request format: " + jsonError.message,
        400,
        "INVALID_REQUEST"
      );
    }
    
    const { vin, mileage, gearbox } = requestData;
    
    // Log operation start
    logOperation('valuation_request_received', { 
      requestId, 
      vin, 
      mileage, 
      gearbox,
      timestamp: new Date().toISOString() 
    });
    
    perfTracker.checkpoint('request_parsed');

    // Input validation
    if (!isValidVin(vin)) {
      logOperation('validation_error', { 
        requestId, 
        error: 'Invalid VIN format',
        vin
      }, 'warn');
      
      return formatErrorResponse("Invalid VIN format", 400, "VALIDATION_ERROR");
    }
    
    if (!isValidMileage(mileage)) {
      logOperation('validation_error', { 
        requestId, 
        error: 'Invalid mileage value',
        mileage
      }, 'warn');
      
      return formatErrorResponse("Invalid mileage value", 400, "VALIDATION_ERROR");
    }
    
    perfTracker.checkpoint('validation_complete');

    // Check cache first
    const cachedData = await checkCache(vin, requestId);
    perfTracker.checkpoint('cache_check');

    if (cachedData) {
      // If we have cached data, update with current mileage and return
      const result: ValuationData = {
        ...cachedData,
        vin,
        mileage
      };
      
      perfTracker.complete('success', { 
        source: 'cache',
        vin,
        hasData: true
      });
      
      return formatSuccessResponse(result);
    }

    // Call external valuation API
    const apiResponse = await callValuationApi(vin, mileage, requestId);
    perfTracker.checkpoint('api_call_complete');
    
    if (!apiResponse.success) {
      perfTracker.complete('failure', { 
        reason: apiResponse.errorCode,
        vin,
        error: apiResponse.error
      });
      
      return formatErrorResponse(
        apiResponse.error,
        400,
        apiResponse.errorCode
      );
    }

    // Process the API data into standardized format
    const processedData = processValuationData(
      apiResponse.data,
      vin,
      mileage,
      requestId
    );
    
    perfTracker.checkpoint('data_processing');
    
    // Store result in cache in background (don't await)
    storeInCache(vin, processedData, requestId)
      .catch(cacheError => {
        logOperation('cache_store_background_error', { 
          requestId, 
          vin,
          error: cacheError.message
        }, 'warn');
      });

    perfTracker.complete('success', { 
      source: 'api',
      vin,
      hasData: true,
      hasVehicleDetails: !!(processedData.make && processedData.model)
    });
    
    logOperation('valuation_request_complete', { 
      requestId, 
      vin,
      success: true,
      timestamp: new Date().toISOString()
    });

    return formatSuccessResponse(processedData);
  } catch (error) {
    const errorId = crypto.randomUUID().substring(0, 8);
    
    logOperation('unhandled_error', {
      errorId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatServerErrorResponse(
      `Error processing valuation request [ID:${errorId}]: ${error.message}`,
      500,
      "INTERNAL_ERROR"
    );
  }
});
