import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.168.0/encoding/hex.ts";

const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Input string for checksum (length):', input.length);
  console.log('API Secret length:', apiSecret.length);
  
  // Generate MD5 checksum using crypto API
  const hash = new Uint8Array(
    crypto.subtle.digestSync(
      "MD5",
      new TextEncoder().encode(input)
    )
  );
  const checksum = encodeHex(hash);

  console.log('Generated checksum:', checksum);
  return checksum;
};

const validateApiSecret = (apiSecret: string | undefined): string => {
  if (!apiSecret) {
    console.error('CAR_API_SECRET is not set in environment variables');
    throw new Error('API secret is missing from environment configuration');
  }
  
  if (apiSecret.length !== 32) {
    console.error(`Invalid API secret length: ${apiSecret.length}, expected 32 characters`);
    throw new Error('Invalid API secret format');
  }
  
  return apiSecret;
};

const constructApiUrl = (params: {
  apiId: string;
  checksum: string;
  vin: string;
  mileage: number;
}): string => {
  const baseUrl = 'https://bp.autoiso.pl/api/v3/getVinValuation';
  const url = `${baseUrl}/apiuid:${params.apiId}/checksum:${params.checksum}/vin:${params.vin}/odometer:${params.mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
  
  console.log('Constructed API URL components:', {
    baseUrl,
    apiId: params.apiId,
    checksum: params.checksum,
    vin: params.vin,
    mileage: params.mileage
  });
  
  return url;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage = 50000, gearbox = 'manual' } = await req.json();
    console.log('Received request with VIN:', vin, 'Mileage:', mileage, 'Gearbox:', gearbox);

    if (!vin) {
      throw new Error('VIN number is required');
    }

    const apiId = 'AUTOSTRA';
    const apiSecret = validateApiSecret(Deno.env.get('CAR_API_SECRET'));
    const checksum = calculateChecksum(apiId, apiSecret, vin);
    const apiUrl = constructApiUrl({ apiId, checksum, vin, mileage });

    console.log('Making request to external API...');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    if (responseData.apiStatus !== 'OK') {
      console.error('API returned error status:', responseData);
      throw new Error(responseData.message || 'API returned an error');
    }

    const valuationResult = {
      make: responseData.functionResponse?.userParams?.make || 'Not available',
      model: responseData.functionResponse?.userParams?.model || 'Not available',
      year: responseData.functionResponse?.userParams?.year || null,
      vin: vin,
      transmission: gearbox,
      fuelType: responseData.functionResponse?.userParams?.fuel || 'Not available',
      valuation: responseData.functionResponse?.valuation?.calcValuation?.price || 0,
    };

    console.log('Transformed valuation result:', valuationResult);

    return new Response(
      JSON.stringify({
        success: true,
        data: valuationResult,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in Edge Function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An unexpected error occurred',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});