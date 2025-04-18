
/**
 * VIN Validation Edge Function
 * Updated: 2025-04-18 - Using absolute URLs for all imports to improve deployment reliability
 * Updated: 2025-04-18 - Replaced external MD5 import with Web Crypto API
 * Updated: 2025-04-18 - Enhanced logging and API response handling
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Error types
export class ValidationError extends Error {
  code: string;
  status: number;
  
  constructor(message: string, code = 'VALIDATION_ERROR', status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.status = status;
  }
}

// Response formatting
const formatSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify({
      success: true,
      data
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

const formatErrorResponse = (error: string, status = 400, code = 'ERROR') => {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      code
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

const formatServerErrorResponse = (error: any, status = 500, code = 'SERVER_ERROR') => {
  const message = error instanceof Error ? error.message : String(error);
  return new Response(
    JSON.stringify({
      success: false,
      error: `Server error: ${message}`,
      code
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    }
  );
};

// Validation helpers
const isValidVin = (vin: string): boolean => {
  if (!vin || typeof vin !== 'string') return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
};

const isValidMileage = (mileage: any): boolean => {
  if (mileage === undefined || mileage === null) return false;
  const mileageNumber = Number(mileage);
  return !isNaN(mileageNumber) && mileageNumber >= 0 && mileageNumber <= 1000000;
};

// Logging utilities
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const logOperation = (
  operation: string, 
  details: Record<string, any>,
  level: LogLevel = 'info'
): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    level,
    ...details
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      console.debug(JSON.stringify(logEntry));
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
};

// Create Supabase client
const createSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Calculate MD5 hash using Web Crypto API
async function calculateMD5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Main function handler
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage, userId, allowExisting = false, requestId = crypto.randomUUID() } = await req.json();
    
    logOperation('validate_vin_request_received', { 
      requestId, 
      vin, 
      mileage, 
      allowExisting,
      timestamp: new Date().toISOString()
    });

    // Basic validation
    if (!isValidVin(vin)) {
      return formatErrorResponse("Invalid VIN format. VIN must be 17 characters long and contain only letters and numbers.", 400, "INVALID_VIN");
    }
    
    if (!isValidMileage(mileage)) {
      return formatErrorResponse("Invalid mileage value. Mileage must be a positive number under 1,000,000.", 400, "INVALID_MILEAGE");
    }
    
    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Check if vehicle with this VIN already exists
    const { data: existingVehicles, error: vehicleError } = await supabase
      .from('cars')
      .select('id, vin')
      .eq('vin', vin)
      .limit(1);
    
    if (vehicleError) {
      logOperation('vehicle_check_error', { 
        requestId,
        error: vehicleError.message,
        details: vehicleError
      }, 'error');
      
      return formatServerErrorResponse(vehicleError);
    }
    
    const vehicleExists = existingVehicles && existingVehicles.length > 0;
    
    // If vehicle exists and we're not allowing existing, return an error
    if (vehicleExists && !allowExisting) {
      logOperation('vehicle_already_exists', { requestId, vin }, 'warn');
      
      return formatErrorResponse(
        "A vehicle with this VIN already exists in our system.",
        400,
        "VEHICLE_EXISTS"
      );
    }
    
    // Get valuation data
    const apiId = Deno.env.get("VALUATION_API_ID") || "AUTOSTRA";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || "A4FTFH54C3E37P2D34A16A7A4V41XKBF";
    
    if (!apiId || !apiSecret) {
      logOperation('missing_valuation_credentials', { requestId }, 'error');
      
      return formatServerErrorResponse(
        "Missing API credentials for valuation service",
        500,
        "CONFIG_ERROR"
      );
    }
    
    // Calculate checksum for valuation API
    const checksumContent = apiId + apiSecret + vin;
    const checksum = await calculateMD5(checksumContent);
    
    // Log API request details for debugging
    logOperation('calling_valuation_api', { 
      requestId, 
      vin,
      mileage,
      apiId,
      apiEndpoint: "https://bp.autoiso.pl/api/v3/getVinValuation/",
      checksumGenerated: true
    });
    
    // Call external valuation API
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    try {
      const response = await fetch(valuationUrl);
      
      if (!response.ok) {
        logOperation('valuation_api_http_error', { 
          requestId,
          status: response.status,
          statusText: response.statusText
        }, 'error');
        
        return formatErrorResponse(
          `Valuation API responded with status: ${response.status} ${response.statusText}`,
          response.status,
          "API_ERROR"
        );
      }
      
      const responseText = await response.text();
      logOperation('valuation_api_raw_response', { 
        requestId,
        responseSize: responseText.length,
        responseSample: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
      });
      
      let valuationData;
      try {
        valuationData = JSON.parse(responseText);
      } catch (parseError) {
        logOperation('valuation_api_parse_error', { 
          requestId,
          error: parseError.message,
          responseText: responseText.substring(0, 500)
        }, 'error');
        
        return formatErrorResponse(
          "Failed to parse valuation API response",
          400,
          "PARSE_ERROR"
        );
      }
      
      if (!valuationData) {
        logOperation('empty_valuation_data', { requestId }, 'error');
        return formatErrorResponse(
          "Received empty response from valuation API",
          400,
          "EMPTY_RESPONSE"
        );
      }
      
      if (valuationData.error) {
        logOperation('valuation_api_returned_error', { 
          requestId,
          error: valuationData.error
        }, 'error');
        
        return formatErrorResponse(
          valuationData.error || "Failed to get valuation from external service",
          400,
          "VALUATION_ERROR"
        );
      }
      
      // Log received data for debugging
      logOperation('valuation_data_received', { 
        requestId,
        dataKeys: Object.keys(valuationData),
        hasBasicInfo: !!(valuationData.make && valuationData.model && valuationData.year),
        hasPricing: !!(valuationData.price_min !== undefined || valuationData.price_med !== undefined || valuationData.price !== undefined),
        rawSample: JSON.stringify(valuationData).substring(0, 200) + '...'
      });
      
      // Process the valuation result
      // Extract essential data with fallbacks for missing properties
      const make = valuationData.make || valuationData.manufacturer || '';
      const model = valuationData.model || valuationData.modelName || '';
      const year = valuationData.year || valuationData.productionYear || new Date().getFullYear();
      const transmission = valuationData.transmission || 'manual';
      
      // Calculate base price (average of min and median prices)
      // Handle different possible price field names
      let priceMin = 0;
      let priceMed = 0;
      
      if (valuationData.price_min !== undefined) {
        priceMin = parseFloat(valuationData.price_min);
      } else if (valuationData.priceMin !== undefined) {
        priceMin = parseFloat(valuationData.priceMin);
      } else if (valuationData.minimum_price !== undefined) {
        priceMin = parseFloat(valuationData.minimum_price);
      } else if (valuationData.price !== undefined) {
        priceMin = parseFloat(valuationData.price);
      }
      
      if (valuationData.price_med !== undefined) {
        priceMed = parseFloat(valuationData.price_med);
      } else if (valuationData.priceMed !== undefined) {
        priceMed = parseFloat(valuationData.priceMed);
      } else if (valuationData.median_price !== undefined) {
        priceMed = parseFloat(valuationData.median_price);
      } else if (valuationData.price !== undefined) {
        priceMed = parseFloat(valuationData.price);
      }
      
      // Fallback: if we don't have min/med prices but have a general price
      if ((priceMin === 0 || priceMed === 0) && valuationData.price) {
        const price = parseFloat(valuationData.price);
        if (price > 0) {
          priceMin = price;
          priceMed = price;
        }
      }
      
      // If we still don't have prices, check for any field that might contain price data
      if (priceMin === 0 || priceMed === 0) {
        for (const [key, value] of Object.entries(valuationData)) {
          if (typeof value === 'number' && 
              (key.toLowerCase().includes('price') || key.toLowerCase().includes('value')) && 
              value > 0) {
            if (priceMin === 0) priceMin = value;
            if (priceMed === 0) priceMed = value;
          }
        }
      }
      
      logOperation('price_extraction', { 
        requestId,
        priceMin,
        priceMed,
        originalPriceMin: valuationData.price_min,
        originalPriceMed: valuationData.price_med,
        priceFields: Object.keys(valuationData).filter(k => 
          k.toLowerCase().includes('price') || 
          k.toLowerCase().includes('value')
        )
      });
      
      // Check if we have valid pricing data
      if (priceMin <= 0 || priceMed <= 0) {
        logOperation('invalid_pricing_data', { 
          requestId,
          priceMin,
          priceMed,
          rawData: JSON.stringify(valuationData).substring(0, 500) + '...'
        }, 'warn');
        
        // If we don't have make/model but no pricing, we still return the data we have
        if (!make || !model) {
          return formatErrorResponse(
            "Could not retrieve valid pricing data for this vehicle",
            400,
            "INVALID_PRICING"
          );
        }
        
        // If we have make/model but no pricing, set default values for pricing
        priceMin = 30000;
        priceMed = 30000;
        
        logOperation('using_default_pricing', {
          requestId,
          make,
          model
        }, 'warn');
      }
      
      const basePrice = (priceMin + priceMed) / 2;
      
      // Calculate reserve price based on our pricing tiers
      let reservePercentage = 0.25; // Default percentage
      
      if (basePrice <= 15000) reservePercentage = 0.65;
      else if (basePrice <= 20000) reservePercentage = 0.46;
      else if (basePrice <= 30000) reservePercentage = 0.37;
      else if (basePrice <= 50000) reservePercentage = 0.27;
      else if (basePrice <= 60000) reservePercentage = 0.27;
      else if (basePrice <= 70000) reservePercentage = 0.22;
      else if (basePrice <= 80000) reservePercentage = 0.23;
      else if (basePrice <= 100000) reservePercentage = 0.24;
      else if (basePrice <= 130000) reservePercentage = 0.20;
      else if (basePrice <= 160000) reservePercentage = 0.185;
      else if (basePrice <= 200000) reservePercentage = 0.22;
      else if (basePrice <= 250000) reservePercentage = 0.17;
      else if (basePrice <= 300000) reservePercentage = 0.18;
      else if (basePrice <= 400000) reservePercentage = 0.18;
      else if (basePrice <= 500000) reservePercentage = 0.16;
      else reservePercentage = 0.145;
      
      const reservePrice = basePrice - (basePrice * reservePercentage);
      
      logOperation('reserve_price_calculated', { 
        requestId,
        basePrice,
        reservePercentage,
        reservePrice: Math.round(reservePrice),
        tiersUsed: true
      });
      
      // Return the successful result
      return formatSuccessResponse({
        vin,
        vehicleExists,
        make,
        model,
        year,
        transmission,
        averagePrice: Math.round(basePrice),
        reservePrice: Math.round(reservePrice),
        valuationData: {
          make,
          model,
          year,
          transmission,
          priceMin,
          priceMed,
          calculatedBasePrice: basePrice,
          calculatedReservePrice: reservePrice
        }
      });
    } catch (apiError) {
      logOperation('valuation_api_exception', { 
        requestId,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : null
      }, 'error');
      
      return formatServerErrorResponse(
        apiError,
        500,
        "API_ERROR"
      );
    }
  } catch (error) {
    logOperation('unhandled_exception', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null
    }, 'error');
    
    return formatServerErrorResponse(error);
  }
});
