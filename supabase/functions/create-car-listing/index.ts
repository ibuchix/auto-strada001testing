
// create-car-listing/index.ts
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
    const extractedCarData = {
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      mileage: Number(mileage),
      vin: vin,
      price: valuationData.price_med || valuationData.averagePrice,
      transmission: transmission,
      is_draft: true,
      valuation_data: valuationData
    };
    
    logOperation('processing_request', { 
      requestId, 
      userId,
      vin, 
      make: extractedCarData.make,
      model: extractedCarData.model
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
          error: securityDefinerError.message
        }, 'warn');
      }
    } catch (rpcError) {
      logOperation('security_definer_exception', {
        requestId,
        userId,
        error: (rpcError as Error).message
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
        error: result.error?.message
      }, 'error');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: result.error?.message || 'Failed to create car listing'
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
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
