import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const calculateChecksum = (apiId: string, apiSecret: string, registration: string) => {
  const input = apiId + apiSecret + registration;
  // Use the crypto.subtle.digestSync method from Deno's std/crypto
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registration } = await req.json();
    
    if (!registration) {
      return new Response(
        JSON.stringify({ error: 'Registration number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API credentials from environment variables
    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiId || !apiSecret) {
      console.error('API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate checksum
    const checksum = calculateChecksum(apiId, apiSecret, registration);
    console.log('Making API request with:', { apiId, registration, checksum });

    // Make API request
    const response = await fetch(
      `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${registration}/odometer:0/currency:PLN`
    );

    if (!response.ok) {
      console.error('API request failed:', await response.text());
      throw new Error('Failed to fetch car data');
    }

    const carData = await response.json();
    console.log('Received car data:', carData);

    return new Response(
      JSON.stringify(carData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});