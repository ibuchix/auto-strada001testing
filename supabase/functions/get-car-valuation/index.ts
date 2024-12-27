import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Input string for checksum:', input);

  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  const checksum = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
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
      throw new Error('API configuration error: Missing credentials');
    }

    const checksum = calculateChecksum(apiId, apiSecret, vin);
    // Using getVinInfo endpoint which provides basic vehicle information
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinInfo/apiuid:${apiId}/checksum:${checksum}/vin:${vin}`;

    console.log('Constructed API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    if (responseData.apiStatus === 'ER') {
      throw new Error(responseData.message || 'API returned an error');
    }

    // Extract data from the vehicle object in the response
    const vehicleData = responseData.vehicle || responseData;
    
    const valuationResult = {
      make: vehicleData.marka || vehicleData.make || 'Not available',
      model: vehicleData.model || 'Not available',
      year: vehicleData.rok_produkcji || vehicleData.year || null,
      vin: vin,
      transmission: vehicleData.skrzynia_biegow || vehicleData.transmission || 'Not available',
      fuelType: vehicleData.rodzaj_paliwa || vehicleData.fuel_type || 'Not available',
      valuation: 50000 // Default value since we're using getVinInfo endpoint
    };

    console.log('Transformed valuation result:', valuationResult);
    return new Response(JSON.stringify(valuationResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
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
        valuation: 0,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});