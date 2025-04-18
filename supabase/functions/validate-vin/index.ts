
/**
 * VIN Validation Edge Function
 * Updated: 2025-04-18 - Using absolute URLs for all imports to improve deployment reliability
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { md5 } from "https://deno.land/std@0.187.0/hash/md5.ts";

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
  // Basic validation - VINs should be 17 characters and contain only valid characters
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
    const apiId = Deno.env.get("VALUATION_API_ID") || "";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || "";
    
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
    const checksum = md5.toString(new TextEncoder().encode(checksumContent));
    
    // Call external valuation API
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('calling_valuation_api', { 
      requestId, 
      vin,
      url: valuationUrl.replace(checksum, 'REDACTED')
    });
    
    try {
      const response = await fetch(valuationUrl);
      const valuationData = await response.json();
      
      if (!valuationData || valuationData.error) {
        logOperation('valuation_api_error', { 
          requestId,
          error: valuationData?.error || 'Unknown error',
          response: valuationData
        }, 'error');
        
        return formatErrorResponse(
          valuationData?.error || "Failed to get valuation from external service",
          400,
          "VALUATION_ERROR"
        );
      }
      
      // Process the valuation result
      logOperation('valuation_success', { 
        requestId,
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year
      });
      
      // Calculate base price (average of min and median prices)
      const priceMin = valuationData.price_min || valuationData.price || 0;
      const priceMed = valuationData.price_med || valuationData.price || 0;
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
        reservePrice
      });
      
      // Return the successful result
      return formatSuccessResponse({
        vin,
        vehicleExists,
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        transmission: valuationData.transmission,
        averagePrice: basePrice,
        reservePrice: Math.round(reservePrice),
        valuationData
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
