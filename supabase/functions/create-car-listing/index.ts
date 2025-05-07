
// create-car-listing/index.ts
/**
 * Updated: 2025-05-07 - Fixed pricing by using reservePrice from valuation data
 * This ensures the car listing uses the accurate reserve price calculated during valuation
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "./utils/cors.ts";
import { createListing } from "./utils/listing.ts";
import { logOperation } from "./utils/logging.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    logOperation('request_start', { requestId }, 'info');
    
    // Get the request body
    const requestData = await req.json();
    const { 
      valuationData,
      userId, 
      vin, 
      mileage, 
      transmission,
      reservationId
    } = requestData;
    
    // Validate required fields
    if (!userId || !vin || !valuationData) {
      logOperation('validation_error', { 
        requestId, 
        error: 'Missing required fields'
      }, 'error');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate that valuation data contains a reserve price
    if (!valuationData.reservePrice && !valuationData.valuation) {
      logOperation('price_validation_error', {
        requestId,
        error: 'Missing reserve price in valuation data',
        valuationKeys: Object.keys(valuationData)
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Valuation data is missing required reserve price information'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get the authorization header which includes the user's JWT
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client with service role for admin operations
    // This bypasses RLS policies
    const adminServiceClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Create a client with the user's JWT if available
    const clientWithAuth = authHeader
      ? createClient(
          SUPABASE_URL,
          SUPABASE_ANON_KEY,
          { global: { headers: { Authorization: authHeader } } }
        )
      : adminServiceClient;
    
    // Extract basic car data from valuation
    // CRITICAL UPDATE: Use the reservePrice as the price field to ensure pricing accuracy
    // Log price-related values for debugging
    logOperation('price_data', {
      requestId,
      reservePrice: valuationData.reservePrice,
      averagePrice: valuationData.averagePrice,
      basePrice: valuationData.basePrice,
      price_med: valuationData.price_med,
      valuation: valuationData.valuation
    });
    
    const extractedCarData = {
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      mileage: Number(mileage),
      vin: vin,
      // Use reservePrice as the primary price value
      price: valuationData.reservePrice || valuationData.valuation,
      transmission: transmission,
      is_draft: true,
      valuation_data: valuationData
    };
    
    // Validate that the price is actually set
    if (!extractedCarData.price) {
      logOperation('missing_price_error', {
        requestId,
        extractedCarData,
        valuationDataKeys: Object.keys(valuationData)
      }, 'error');
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to determine price from valuation data'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    logOperation('processing_request', { 
      requestId, 
      userId,
      vin, 
      make: extractedCarData.make,
      model: extractedCarData.model,
      price: extractedCarData.price
    });
    
    // First attempt using security definer function
    try {
      const { data: securityDefinerResult, error: securityDefinerError } = await clientWithAuth.rpc(
        'create_car_listing',
        {
          p_car_data: extractedCarData,
          p_user_id: userId
        }
      );
      
      if (!securityDefinerError && securityDefinerResult?.success) {
        logOperation('security_definer_success', { 
          requestId, 
          userId,
          carId: securityDefinerResult.car_id
        });
        
        // Mark reservation as used if provided
        if (reservationId) {
          await adminServiceClient
            .from('vin_reservations')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', reservationId);
        }
        
        // Return the successful result
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { id: securityDefinerResult.car_id, car_id: securityDefinerResult.car_id }
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Log the error but continue to try alternative methods
      if (securityDefinerError) {
        logOperation('security_definer_error', {
          requestId,
          userId,
          error: securityDefinerError.message,
          details: securityDefinerError
        }, 'warn');
      }
    } catch (rpcError) {
      logOperation('security_definer_exception', {
        requestId,
        userId,
        error: (rpcError as Error).message,
        stack: (rpcError as Error).stack
      }, 'warn');
    }
    
    // Fall back to our utility function which tries several approaches
    const result = await createListing(
      adminServiceClient,  // Use admin client to bypass RLS
      extractedCarData,
      userId,
      requestId
    );
    
    if (!result.success) {
      logOperation('create_listing_failed', {
        requestId,
        userId,
        error: result.error?.message,
        errorDetails: result.error,
        carData: extractedCarData
      }, 'error');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: result.error?.message || 'Failed to create car listing',
          details: result.details || {},
          code: result.code || 'UNKNOWN_ERROR'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Mark reservation as used if provided
    if (reservationId) {
      await adminServiceClient
        .from('vin_reservations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);
    }
    
    logOperation('request_success', {
      requestId,
      userId,
      carId: result.data?.car_id || result.data?.id
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result.data
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Unhandled error in edge function:', error);
    
    // Attempt to extract most useful error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: errorMessage,
        errorType: errorName,
        // Include diagnostic information
        diagnostic: {
          timestamp: new Date().toISOString(),
          isError: error instanceof Error,
          stack: errorStack
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
