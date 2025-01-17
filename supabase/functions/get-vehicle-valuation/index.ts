import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const API_ID = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
const API_SECRET = Deno.env.get('CAR_API_SECRET');

if (!API_SECRET) {
  throw new Error('CAR_API_SECRET is not set');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage, gearbox } = await req.json();
    console.log('Received request:', { vin, mileage, gearbox });

    if (!vin || !mileage || !gearbox) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Missing required parameters",
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Calculate checksum
    const encoder = new TextEncoder();
    const data = encoder.encode(API_ID + API_SECRET + vin);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    console.log('Calling external API:', apiUrl);

    const response = await fetch(apiUrl);
    const result = await response.json();

    console.log('API Response:', result);

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "An unexpected error occurred",
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});