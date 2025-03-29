
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders, logOperation } from './utils.ts';
import { ValuationRequest, ProxyBidRequest } from './types.ts';
import { validateVin, processProxyBids } from './operations.ts';

serve(async (req) => {
  // Add detailed request logging
  const requestId = crypto.randomUUID();
  const requestStartTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { operation } = requestData;
    
    // Extract idempotency key from request headers
    const idempotencyKey = req.headers.get('X-Idempotency-Key');
    
    // Log operation start with request ID for tracing
    logOperation('request_start', { 
      requestId, 
      operation,
      method: req.method,
      url: req.url,
      idempotencyKey: idempotencyKey || 'none'
    });

    // If idempotency key is provided, check cache for previous response
    if (idempotencyKey) {
      const cachedResponse = await checkIdempotencyCache(idempotencyKey);
      if (cachedResponse) {
        logOperation('request_complete_from_cache', {
          requestId,
          operation,
          idempotencyKey,
          executionTime: Date.now() - requestStartTime
        });
        
        return new Response(
          JSON.stringify(cachedResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    let response;
    
    switch (operation) {
      case 'validate_vin': {
        const { vin, mileage, gearbox, userId } = requestData as ValuationRequest;
        response = await validateVin(supabase, vin, mileage, gearbox, userId);
        break;
      }

      case 'process_proxy_bids': {
        const { carId } = requestData as ProxyBidRequest;
        if (!carId) {
          throw new Error('Car ID is required for processing proxy bids');
        }
        response = await processProxyBids(supabase, carId);
        break;
      }
      
      case 'cache_valuation': {
        // Handle caching valuation data with elevated permissions
        const { vin, mileage, valuation_data } = requestData;
        
        if (!vin || !mileage || !valuation_data) {
          throw new Error('Missing required parameters for caching valuation');
        }
        
        const { error } = await supabase.rpc(
          'store_vin_valuation_cache',
          { 
            p_vin: vin, 
            p_mileage: mileage, 
            p_valuation_data: valuation_data 
          }
        );
        
        if (error) throw error;
        
        response = {
          success: true,
          message: 'Valuation data cached successfully'
        };
        break;
      }

      default:
        throw new Error('Invalid operation');
    }
    
    // If idempotency key is provided, cache the response
    if (idempotencyKey) {
      await cacheIdempotencyResponse(idempotencyKey, response);
    }
    
    // Log successful completion with timing information
    const executionTime = Date.now() - requestStartTime;
    logOperation('request_complete', { 
      requestId, 
      operation,
      executionTime,
      status: 'success',
      idempotencyKey: idempotencyKey || 'none'
    });
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error information
    const executionTime = Date.now() - requestStartTime;
    logOperation('request_error', { 
      requestId,
      executionTime,
      errorMessage: error.message,
      errorStack: error.stack,
      errorCode: error.code || 'UNKNOWN_ERROR'
    }, 'error');
    
    return new Response(
      JSON.stringify({
        success: false,
        data: {
          error: error.message || 'Failed to process seller operation',
          errorCode: error.code || 'SYSTEM_ERROR'
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Check if a response is already cached for the given idempotency key
 */
async function checkIdempotencyCache(idempotencyKey: string): Promise<any> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );
    
    const { data, error } = await supabase
      .from('idempotency_keys')
      .select('response_data')
      .eq('key', idempotencyKey)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.response_data;
  } catch (error) {
    console.error('Error checking idempotency cache:', error);
    return null; // Proceed with normal request processing
  }
}

/**
 * Cache the response for the given idempotency key
 */
async function cacheIdempotencyResponse(idempotencyKey: string, response: any): Promise<void> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );
    
    // Use upsert to handle potential race conditions
    await supabase
      .from('idempotency_keys')
      .upsert({
        key: idempotencyKey,
        response_data: response,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }, {
        onConflict: 'key'
      });
      
  } catch (error) {
    console.error('Error caching idempotency response:', error);
    // Don't throw - this is a best-effort operation
  }
}
