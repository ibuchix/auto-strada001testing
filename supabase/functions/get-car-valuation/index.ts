import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getVehicleValuation } from "./services/valuationService.ts";
import { ValuationRequest, ErrorResponse } from "./types.ts";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

serve(async (req) => {
  console.log('Valuation request received:', new Date().toISOString());
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    let parsedBody: ValuationRequest;
    try {
      parsedBody = JSON.parse(requestBody);
      console.log('Parsed request body:', parsedBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempt ${attempt} of ${MAX_RETRIES}`);
        const valuationResult = await getVehicleValuation(parsedBody);
        console.log('Valuation completed successfully:', valuationResult);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Valuation completed successfully',
            data: valuationResult
          }),
          { 
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error);
        lastError = error;
        
        if (attempt < MAX_RETRIES) {
          console.log(`Waiting ${RETRY_DELAY}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    // If we get here, all retries failed
    const errorResponse: ErrorResponse = {
      success: false,
      message: lastError?.message || 'Failed to get valuation after multiple attempts',
      error: lastError,
      timestamp: new Date().toISOString()
    };

    console.error('All retry attempts failed:', errorResponse);

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );

  } catch (error) {
    console.error('Unhandled error in valuation request:', error);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: error.message || 'An unexpected error occurred',
      error: error,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      }
    );
  }
});