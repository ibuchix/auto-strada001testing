
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { validateSchema, valuationRequestSchema, carOperationSchema } from './schema-validation.ts';
import { handleGetValuation } from './valuation-handler.ts';
import { handleProxyBids } from './proxy-bid-handler.ts';
import { setupIdempotencyTable, checkIdempotencyKey, recordIdempotencyRequest, updateIdempotencyRecord } from '../_shared/setup-scripts/idempotency.ts';
import { corsHeaders } from './cors.ts';

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Set up idempotency table if needed
    await setupIdempotencyTable();
    
    // Parse request body
    const requestData = await req.json();
    
    // Generate a consistent request ID for logging
    const requestId = crypto.randomUUID();
    console.log(`Request ${requestId} received:`, JSON.stringify({
      method: req.method,
      url: req.url,
      // Don't log sensitive fields like passwords or full car details
      operation: requestData.operation
    }));
    
    // Validate base request structure
    const baseValidation = validateSchema(carOperationSchema, requestData);
    if (!baseValidation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid request format: ${baseValidation.error}`,
          errorCode: 'SCHEMA_VALIDATION_ERROR'
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        }
      );
    }
    
    // Check for idempotency key in headers
    const idempotencyKey = req.headers.get('X-Idempotency-Key');
    if (idempotencyKey) {
      const requestPath = new URL(req.url).pathname;
      const existingRequest = await checkIdempotencyKey(supabase, idempotencyKey, requestPath);
      
      if (existingRequest.exists) {
        if (existingRequest.status === 'completed') {
          // Return the cached response
          return new Response(
            JSON.stringify(existingRequest.data || { success: true, message: 'Request already processed' }),
            { 
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "X-Idempotency-Status": "reused"
              }
            }
          );
        } else if (existingRequest.status === 'processing') {
          // Request is still being processed
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Your request is still being processed',
              errorCode: 'REQUEST_IN_PROGRESS'
            }),
            { 
              status: 409,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "X-Idempotency-Status": "processing"
              }
            }
          );
        }
      }
      
      // Record this new request
      await recordIdempotencyRequest(
        supabase, 
        idempotencyKey, 
        requestPath, 
        requestData.userId
      );
    }
    
    // Process based on operation
    let responseData;
    
    switch(requestData.operation) {
      case 'get_valuation':
        // Validate valuation-specific schema
        const valuationValidation = validateSchema(valuationRequestSchema, requestData);
        if (!valuationValidation.success) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Invalid valuation request: ${valuationValidation.error}`,
              errorCode: 'VALIDATION_ERROR'
            }),
            { 
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
              }
            }
          );
        }
        
        responseData = await handleGetValuation(supabase, valuationValidation.data!, requestId);
        break;
        
      case 'get_proxy_bids':
        responseData = await handleProxyBids(supabase, requestData);
        break;
        
      default:
        responseData = {
          success: false,
          error: `Unsupported operation: ${requestData.operation}`,
          errorCode: 'UNSUPPORTED_OPERATION'
        };
    }
    
    // Update idempotency record if we're using one
    if (idempotencyKey) {
      await updateIdempotencyRecord(
        supabase,
        idempotencyKey,
        responseData.success ? 'completed' : 'failed',
        responseData
      );
    }
    
    // Return the response
    return new Response(
      JSON.stringify(responseData),
      { 
        status: responseData.success ? 200 : 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Unhandled error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "An unexpected error occurred",
        errorCode: "SERVER_ERROR",
        details: Deno.env.get('ENVIRONMENT') === 'development' ? error.message : undefined
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});
