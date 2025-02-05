
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { corsHeaders } from './utils.ts';
import { ValuationRequest } from './types.ts';
import { handleVinValidation } from './operations.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { operation, vin, mileage, gearbox, userId } = await req.json() as ValuationRequest;
    console.log('Processing seller operation:', { operation, vin, mileage, gearbox, userId });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    switch (operation) {
      case 'validate_vin': {
        const response = await handleVinValidation(supabase, { operation, vin, mileage, gearbox, userId });
        return new Response(
          JSON.stringify(response),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error('Invalid operation');
    }
  } catch (error) {
    console.error('Error in seller operations:', error);
    return new Response(
      JSON.stringify({
        success: false,
        data: {
          error: error.message || 'Failed to process seller operation'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
