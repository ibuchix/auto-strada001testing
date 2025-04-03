
/**
 * Edge function to handle seller operations securely
 * 
 * Supports various seller operations including:
 * - VIN validation and valuation
 * - Cache management
 * - VIN reservations
 * 
 * Enhanced with structured logging and performance tracking
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ValuationRequest, validateRequest } from './schema-validation.ts';
import { handleValuationRequest } from './handlers/valuation-handler.ts';
import { handleCacheOperations } from './handlers/cache-handler.ts';
import { logOperation, logError, createPerformanceTracker } from '../_shared/logging.ts';

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main request handler
serve(async (req) => {
  // Generate a request ID for tracing
  const requestId = crypto.randomUUID();
  
  // Create performance tracker for this request
  const perfTracker = createPerformanceTracker(requestId, 'handle_seller_operation');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const requestData = await req.json();
    
    // Extract correlation ID if provided or generate a new one
    const correlationId = requestData.correlation_id || requestId;
    
    // Log operation type
    logOperation('request_received', { 
      requestId, 
      correlationId,
      operation: requestData.operation,
      timestamp: new Date().toISOString()
    });
    
    perfTracker.checkpoint('request_parsed');
    
    // Initialize Supabase client with environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    perfTracker.checkpoint('supabase_client_created');

    // Route request based on operation type
    switch (requestData.operation) {
      case 'validate_vin': {
        // Validate request schema
        const validationRequest = await validateRequest<ValuationRequest>(requestData, 'validation');
        if (!validationRequest.valid) {
          perfTracker.complete('failure', { reason: 'validation_failed' });
          return new Response(
            JSON.stringify({
              success: false,
              error: validationRequest.error
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }
        
        // Handle valuation request
        const result = await handleValuationRequest(
          supabase, 
          validationRequest.data, 
          correlationId
        );
        
        perfTracker.complete(result.success ? 'success' : 'failure');
        
        return new Response(
          JSON.stringify(result),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
        
      case 'cache_valuation':
      case 'get_cached_valuation': {
        // Handle cache operations
        const result = await handleCacheOperations(
          supabase, 
          requestData.operation, 
          requestData,
          correlationId
        );
        
        perfTracker.complete(result.success ? 'success' : 'failure');
        
        return new Response(
          JSON.stringify(result),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      default:
        // Unknown operation
        perfTracker.complete('failure', { reason: 'unknown_operation' });
        
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unknown operation",
            operation: requestData.operation
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }

  } catch (error) {
    // Log and return error
    logError('unhandled_error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    });
    
    perfTracker.complete('failure', { 
      reason: 'unhandled_error',
      errorType: error.name,
      errorMessage: error.message
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: `Server error: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
