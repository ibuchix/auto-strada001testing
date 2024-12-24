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
  // Handle CORS preflight requests
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
    
    // Construct the full URL with query parameters
    const url = new URL('https://bp.autoiso.pl/api/v3/getVinValuation');
    url.searchParams.append('apiuid', apiId);
    url.searchParams.append('checksum', checksum);
    url.searchParams.append('vin', vin);
    url.searchParams.append('odometer', '50000');
    url.searchParams.append('currency', 'PLN');
    url.searchParams.append('lang', 'en');
    url.searchParams.append('country', 'PL');
    url.searchParams.append('condition', 'good');
    url.searchParams.append('equipment_level', 'standard');

    console.log('Making API request to:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('API Response:', responseData);

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
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        make: 'Not available',
        model: 'Not available',
        year: null,
        vin: '',
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