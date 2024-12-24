import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  // Concatenate the strings without any spaces or special characters
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Input string for checksum:', input);
  
  // Create MD5 hash
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  const checksum = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  console.log('Generated checksum:', checksum);
  return checksum;
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registration: vin } = await req.json();
    console.log('Received VIN:', vin);
    
    if (!vin) {
      throw new Error('VIN number is required');
    }

    // Get API credentials from environment variables
    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiId || !apiSecret) {
      console.error('Missing API credentials');
      throw new Error('API configuration error');
    }

    console.log('Using API ID:', apiId);
    
    // Calculate checksum
    const checksum = calculateChecksum(apiId, apiSecret, vin);
    
    // Construct API URL with proper encoding and all required parameters
    const baseUrl = 'https://bp.autoiso.pl/api/v3/getVinValuation';
    const params = new URLSearchParams({
      'apiuid': apiId,
      'checksum': checksum,
      'vin': vin,
      'odometer': '50000', // Add a default mileage
      'currency': 'PLN',
      'lang': 'en',  // English responses
      'country': 'PL', // Required parameter for Poland
      'condition': 'good', // Vehicle condition
      'equipment_level': 'standard' // Standard equipment level
    });

    const apiUrl = `${baseUrl}?${params.toString()}`;
    console.log('Making API request to:', apiUrl);

    // Make API request
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

    // Return the response with CORS headers
    return new Response(JSON.stringify(carData), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});