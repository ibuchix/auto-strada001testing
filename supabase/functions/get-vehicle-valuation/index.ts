
/**
 * Edge function for getting vehicle valuations
 * Updated: 2025-04-17 - Enhanced data validation and processing
 * Updated: 2025-04-17 - Fixed all shared module import paths
 */

import { corsHeaders } from "../_shared/cors.ts";
import { logOperation } from "../_shared/logging.ts";
import { formatSuccessResponse, formatErrorResponse } from "../_shared/response-formatter.ts";
import { validateVehicleData, normalizeValuationData } from "../_shared/validation.ts";
import { fetchExternalValuation } from "./api-service.ts";
import { checkCache, storeInCache } from "./cache-service.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  
  try {
    const { vin, mileage, gearbox } = await req.json();
    
    // Validate required parameters
    if (!vin || !mileage) {
      return formatErrorResponse(
        "Missing required parameters",
        400,
        "MISSING_PARAMETERS"
      );
    }
    
    // Log the valuation request
    logOperation('valuation_request', { requestId, vin, mileage, gearbox });
    
    // Check cache first
    const cachedResult = await checkCache(vin, mileage, requestId);
    if (cachedResult) {
      // Validate cached data
      const { isValid, errors } = validateVehicleData(cachedResult, requestId);
      if (isValid) {
        return formatSuccessResponse(cachedResult);
      }
      logOperation('cached_data_invalid', { requestId, errors });
    }
    
    // Get valuation from external API
    const valuationResult = await fetchExternalValuation(vin, mileage, requestId);
    
    if (!valuationResult.success) {
      return formatErrorResponse(
        valuationResult.error || "Failed to retrieve valuation",
        400,
        valuationResult.errorCode
      );
    }
    
    // Normalize and validate the data
    const normalizedData = normalizeValuationData(valuationResult.data, requestId);
    const { isValid, errors } = validateVehicleData(normalizedData, requestId);
    
    if (!isValid) {
      return formatErrorResponse(
        `Invalid valuation data: ${errors.join(", ")}`,
        400,
        "VALIDATION_ERROR"
      );
    }
    
    // Store in cache
    await storeInCache(vin, mileage, normalizedData, requestId);
    
    // Return success response
    logOperation('valuation_success', { 
      requestId, 
      vin, 
      dataSize: JSON.stringify(normalizedData).length
    });
    
    return formatSuccessResponse(normalizedData);
    
  } catch (err) {
    logOperation('valuation_error', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
    
    return formatErrorResponse(
      `Error processing valuation request: ${err.message}`,
      500,
      "INTERNAL_ERROR"
    );
  }
});
