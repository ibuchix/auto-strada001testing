
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from '../_shared/cors.ts';
import { validateVin } from './vin-validation.ts';
import { processProxyBids } from './operations.ts';

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
    
    // Log operation start with request ID for tracing
    console.log(`Request ${requestId} started: ${operation}`);

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
        const { vin, mileage, gearbox, userId } = requestData;
        response = await validateVin(supabase, vin, mileage, gearbox, userId);
        break;
      }

      case 'process_proxy_bids': {
        const { carId } = requestData;
        if (!carId) {
          throw new Error('Car ID is required for processing proxy bids');
        }
        response = await processProxyBids(supabase, carId);
        break;
      }

      default:
        throw new Error('Invalid operation');
    }
    
    // Log successful completion with timing information
    const executionTime = Date.now() - requestStartTime;
    console.log(`Request ${requestId} completed in ${executionTime}ms`);
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log detailed error information
    const executionTime = Date.now() - requestStartTime;
    console.error(`Request error after ${executionTime}ms:`, error.message);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to process seller operation',
        errorCode: error.code || 'SYSTEM_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
