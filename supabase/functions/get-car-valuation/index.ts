import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from 'https://deno.land/std/crypto/mod.ts';

// Function to calculate checksum
const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  const input = `${apiId}${apiSecret}${vin}`;
  const hash = crypto.subtle.digestSync('MD5', new TextEncoder().encode(input));
  const checksum = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return checksum;
};

// Edge function handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract VIN and mileage from the request
    const { vin, mileage = 50000 } = await req.json();
    console.log('Received request with:', { vin, mileage });
    
    if (!vin) throw new Error('VIN number is required');

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    if (!apiSecret) throw new Error('API configuration error: Missing API secret');

    // Construct API URL
    const checksum = calculateChecksum(apiId, apiSecret, vin);
    console.log('Generated checksum:', checksum);
    
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
    console.log('Making request to:', apiUrl);

    // Make the API request with specific headers required by the API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AutoStra-Valuation/1.0',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-API-Key': apiId,
        'X-Checksum': checksum
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Parse the response
    const responseData = await response.json();
    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    // Log specific parts of the response we're trying to access
    console.log('Function Response:', responseData.functionResponse);
    console.log('User Params:', responseData.functionResponse?.userParams);
    console.log('Valuation Data:', responseData.functionResponse?.valuation);

    // Transform response for frontend
    const valuationResult = {
      success: true,
      data: {
        make: responseData.functionResponse?.userParams?.make || 'Not available',
        model: responseData.functionResponse?.userParams?.model || 'Not available',
        year: responseData.functionResponse?.userParams?.year || null,
        vin: responseData.vin || vin,
        transmission: responseData.functionResponse?.userParams?.transmission || 'Not available',
        valuation: responseData.functionResponse?.valuation?.calcValuation?.price || 0,
        mileage,
      },
    };

    console.log('Transformed response:', valuationResult);

    return new Response(JSON.stringify(valuationResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        data: {
          make: 'Not available',
          model: 'Not available',
          year: null,
          vin: '',
          transmission: 'Not available',
          valuation: 0,
          mileage: 0,
        },
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