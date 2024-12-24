import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Input string for checksum:', input);
  
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
    const { registration: vin } = await req.json();
    console.log('Received VIN:', vin);
    
    if (!vin) {
      throw new Error('VIN number is required');
    }

    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiId || !apiSecret) {
      console.error('Missing API credentials');
      throw new Error('API configuration error');
    }

    const checksum = calculateChecksum(apiId, apiSecret, vin);
    
    // Construct the API URL with all required parameters
    const baseUrl = 'https://bp.autoiso.pl/api/v3/getVinValuation';
    const params = new URLSearchParams({
      apiuid: apiId,
      checksum: checksum,
      vin: vin,
      odometer: '50000',
      currency: 'PLN',
      lang: 'en',
      country: 'PL',
      condition: 'good',
      equipment_level: 'standard'
    });

    const apiUrl = `${baseUrl}?${params}`;
    console.log('Making API request to:', apiUrl);

    const response = await fetch(apiUrl);
    console.log('API Response Status:', response.status);
    
    const responseData = await response.json();
    console.log('API Response Data:', responseData);

    if (responseData.apiStatus === 'ER') {
      throw new Error(responseData.message || 'Failed to get vehicle data');
    }

    // Transform the API response into our expected format
    const valuationResult = {
      make: responseData.manufacturer || 'Not available',
      model: responseData.model || 'Not available',
      year: responseData.year_of_production || null,
      vin: vin,
      transmission: responseData.transmission_type || 'Not available',
      fuelType: responseData.fuel_type || 'Not available',
      valuation: responseData.market_value || 0
    };

    return new Response(JSON.stringify(valuationResult), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        make: 'Not available',
        model: 'Not available',
        year: null,
        vin: vin || '',
        transmission: 'Not available',
        fuelType: 'Not available',
        valuation: 0
      }),
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