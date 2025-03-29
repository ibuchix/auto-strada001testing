
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "./cors.ts";
import { logOperation } from "./utils.ts";
import { checkVehicleExists } from "./vehicle-checker.ts";
import { z } from "https://esm.sh/zod@3.22.2";
import * as md5 from "https://esm.sh/js-md5@0.8.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const API_ID = Deno.env.get("CAR_API_ID") || "AUTOSTRA";
const API_SECRET = Deno.env.get("CAR_API_SECRET") || "";

// Input validation schemas
const validateVinSchema = z.object({
  operation: z.literal("validate_vin"),
  vin: z.string().min(17).max(17),
  mileage: z.number().positive(),
  gearbox: z.string(),
  userId: z.string().uuid()
});

const getValuationSchema = z.object({
  operation: z.literal("get_valuation"),
  vin: z.string().min(17).max(17),
  mileage: z.number().positive(),
  currency: z.string().optional().default("PLN")
});

const reserveVinSchema = z.object({
  operation: z.literal("reserve_vin"),
  vin: z.string().min(17).max(17),
  userId: z.string().uuid()
});

const processProxyBidsSchema = z.object({
  operation: z.literal("process_proxy_bids"),
  carId: z.string().uuid()
});

const operationSchema = z.union([
  validateVinSchema,
  getValuationSchema,
  reserveVinSchema,
  processProxyBidsSchema
]);

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate a request ID for debugging/tracing
    const requestId = crypto.randomUUID();
    
    // Parse request body
    const requestData = await req.json();
    logOperation('request_received', { requestId, body: requestData });
    
    // Validate operation type
    const parseResult = operationSchema.safeParse(requestData);
    if (!parseResult.success) {
      logOperation('validation_error', { 
        requestId, 
        error: parseResult.error.toString() 
      }, 'error');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid request format",
          details: parseResult.error.issues 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    const data = parseResult.data;
    
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Route to appropriate handler based on operation type
    let result;
    
    switch (data.operation) {
      case "validate_vin":
        logOperation('validate_vin_start', { requestId, vin: data.vin });
        
        // First check if this car already exists in our database
        const vehicleExists = await checkVehicleExists(
          supabase, 
          data.vin, 
          data.mileage,
          requestId
        );
        
        if (vehicleExists) {
          logOperation('vin_already_exists', { 
            requestId, 
            vin: data.vin 
          });
          
          result = {
            success: false,
            error: "A vehicle with this VIN already exists in our system",
            code: "VIN_EXISTS"
          };
          break;
        }
        
        // If not found, proceed with valuation API call
        result = await getValuationFromAPI(data.vin, data.mileage, data.gearbox, requestId);
        break;
        
      case "get_valuation":
        logOperation('get_valuation_start', { requestId, vin: data.vin });
        result = await getValuationFromAPI(data.vin, data.mileage, "manual", requestId);
        break;
        
      case "reserve_vin":
        logOperation('reserve_vin_start', { 
          requestId, 
          vin: data.vin,
          userId: data.userId
        });
        
        // Create a reservation record
        const { data: reservation, error } = await supabase
          .from('vin_reservations')
          .insert({
            vin: data.vin,
            user_id: data.userId,
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
          })
          .select('id, created_at')
          .single();
          
        if (error) {
          logOperation('reserve_vin_error', { 
            requestId, 
            error: error.message 
          }, 'error');
          
          result = {
            success: false,
            error: "Failed to reserve VIN: " + error.message
          };
        } else {
          logOperation('reserve_vin_success', { 
            requestId, 
            reservationId: reservation.id 
          });
          
          result = {
            success: true,
            reservationId: reservation.id,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          };
        }
        break;
        
      case "process_proxy_bids":
        logOperation('process_proxy_bids_start', { 
          requestId, 
          carId: data.carId 
        });
        
        // Call RPC function to process proxy bids
        const { data: proxyResult, error: proxyError } = await supabase
          .rpc('process_pending_proxy_bids');
          
        if (proxyError) {
          logOperation('process_proxy_bids_error', { 
            requestId, 
            error: proxyError.message 
          }, 'error');
          
          result = {
            success: false,
            error: "Failed to process proxy bids: " + proxyError.message
          };
        } else {
          logOperation('process_proxy_bids_success', { 
            requestId, 
            result: proxyResult 
          });
          
          result = {
            success: true,
            processingResult: proxyResult
          };
        }
        break;
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    logOperation('unhandled_error', { 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error: " + error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Helper function to call the vehicle valuation API
async function getValuationFromAPI(vin: string, mileage: number, gearbox: string, requestId: string) {
  try {
    // Generate checksum for API authentication
    const checksum = md5.default(API_ID + API_SECRET + vin);
    
    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_request', { 
      requestId,
      url: apiUrl
    });
    
    // Call external API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      logOperation('api_error', { 
        requestId, 
        status: response.status,
        error: errorText
      }, 'error');
      
      return {
        success: false,
        error: `API returned error status: ${response.status}`,
        details: errorText
      };
    }
    
    const apiData = await response.json();
    logOperation('api_success', { 
      requestId, 
      responseSize: JSON.stringify(apiData).length
    });
    
    // Store in cache table for future reference
    const { error: cacheError } = await storeInCache(vin, mileage, apiData);
    
    if (cacheError) {
      logOperation('cache_error', { 
        requestId, 
        error: cacheError.message 
      }, 'warn');
    }
    
    // Format response
    return {
      success: true,
      data: {
        vin,
        make: apiData.make,
        model: apiData.model,
        year: apiData.productionYear,
        transmission: gearbox,
        mileage,
        price_min: apiData.priceMin,
        price_max: apiData.priceMax,
        price_med: apiData.priceMed,
        valuationDetails: apiData
      }
    };
  } catch (error) {
    logOperation('api_exception', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: "Failed to get valuation: " + error.message
    };
  }
}

// Store valuation result in cache
async function storeInCache(vin: string, mileage: number, valuationData: any) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  return await supabase.rpc('get_vin_valuation_cache', {
    p_vin: vin,
    p_mileage: mileage,
    p_valuation_data: valuationData
  });
}
