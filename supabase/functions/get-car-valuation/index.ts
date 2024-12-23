import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const calculateChecksum = (apiId: string, apiSecret: string, registration: string) => {
  const input = apiId + apiSecret + registration;
  console.log('Calculating checksum for input:', input);
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  const checksum = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  console.log('Generated checksum:', checksum);
  return checksum;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registration } = await req.json();
    console.log('Received registration:', registration);
    
    if (!registration) {
      return new Response(
        JSON.stringify({ error: 'Registration number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API credentials from environment variables
    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    console.log('API ID:', apiId);
    console.log('API Secret exists:', !!apiSecret);

    if (!apiId || !apiSecret) {
      console.error('API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'API configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate checksum
    const checksum = calculateChecksum(apiId, apiSecret, registration);
    
    // Construct API URL - Fixed the URL construction
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${registration}/odometer:0/currency:PLN`;
    console.log('Making API request to:', apiUrl);

    // Make API request with proper headers
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', response.status);
    const responseText = await response.text();
    console.log('API Response Body:', responseText);

    if (!response.ok) {
      throw new Error(`Failed to fetch car data: ${responseText}`);
    }

    let carData;
    try {
      carData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse API response:', e);
      throw new Error('Invalid response from valuation service');
    }

    console.log('Parsed car data:', carData);

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