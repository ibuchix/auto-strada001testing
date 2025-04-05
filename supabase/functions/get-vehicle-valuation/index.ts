
/**
 * Edge function for getting vehicle valuations
 * This function calls the external valuation API and handles caching
 * 
 * Changes:
 * - Fixed import paths to use correct relative path format for Deno
 * - Ensured all imports have consistent path resolution
 */

// Import shared utilities with explicit path format
import { corsHeaders, handleCorsOptions } from "../../_shared/cors.ts";
import { logOperation } from "../../_shared/logging.ts";
import { formatSuccessResponse, formatErrorResponse } from "../../_shared/response-formatter.ts";

// Import our service modules
import { fetchExternalValuation } from "./api-service.ts";
import { checkCache, storeInCache } from "./cache-service.ts";
import { calculateReservePrice } from "./price-calculator.ts";

// Define the request handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return handleCorsOptions();
  }

  // Get request ID for tracing
  const requestId = crypto.randomUUID();
  
  try {
    // Parse the request body
    const { vin, mileage, gearbox } = await req.json();
    
    // Validate required parameters
    if (!vin || !mileage) {
      return formatErrorResponse(
        "Missing required parameters: vin and mileage are required",
        400,
        "MISSING_PARAMETERS"
      );
    }
    
    // Log the valuation request
    logOperation('valuation_request', { 
      requestId, 
      vin, 
      mileage, 
      gearbox 
    });
    
    // Check cache first
    const cachedResult = await checkCache(vin, mileage, requestId);
    
    if (cachedResult) {
      return formatSuccessResponse(cachedResult);
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
    
    // Calculate base price (average of min and median prices)
    const priceMin = Number(valuationResult.data.price_min) || 0;
    const priceMed = Number(valuationResult.data.price_med) || 0;
    const basePrice = (priceMin + priceMed) / 2;
    
    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice, requestId);
    
    // Prepare the final response data
    const responseData = {
      success: true,
      data: {
        make: valuationResult.data.make,
        model: valuationResult.data.model,
        year: valuationResult.data.year,
        transmission: gearbox,
        mileage: mileage,
        basePrice: basePrice,
        reservePrice: reservePrice,
        valuation: valuationResult.data
      }
    };
    
    // Store in cache
    await storeInCache(vin, mileage, responseData, requestId);
    
    // Return success response
    logOperation('valuation_success', { 
      requestId, 
      vin, 
      dataSize: JSON.stringify(responseData).length
    });
    
    return formatSuccessResponse(responseData.data);
    
  } catch (err) {
    // Log error and return formatted response
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
