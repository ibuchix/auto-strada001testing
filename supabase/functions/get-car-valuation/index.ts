import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculateChecksum(apiId: string, apiSecret: string, vin: string): string {
  console.log('Calculating checksum for:', { apiId, vin });
  const input = `${apiId}${apiSecret}${vin}`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return encode(new Uint8Array(hash));
}

function extractPrice(responseData: any): number | null {
  console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

  // Direct price field
  if (typeof responseData?.price === 'number') {
    console.log('Found direct price:', responseData.price);
    return responseData.price;
  }

  // Check valuation object
  if (typeof responseData?.valuation?.price === 'number') {
    console.log('Found price in valuation object:', responseData.valuation.price);
    return responseData.valuation.price;
  }

  // Check functionResponse object
  if (typeof responseData?.functionResponse?.price === 'number') {
    console.log('Found price in functionResponse:', responseData.functionResponse.price);
    return responseData.functionResponse.price;
  }

  // Check nested valuation object
  if (typeof responseData?.functionResponse?.valuation?.price === 'number') {
    console.log('Found price in nested valuation:', responseData.functionResponse.valuation.price);
    return responseData.functionResponse.valuation.price;
  }

  // Check for estimated_value field
  if (typeof responseData?.estimated_value === 'number') {
    console.log('Found estimated value:', responseData.estimated_value);
    return responseData.estimated_value;
  }

  // Check for value field
  if (typeof responseData?.value === 'number') {
    console.log('Found value:', responseData.value);
    return responseData.value;
  }

  // Check for any numeric price field recursively
  const findPrice = (obj: any): number | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if ((lowerKey.includes('price') || lowerKey.includes('value')) && typeof value === 'number') {
        console.log(`Found price in field ${key}:`, value);
        return value;
      }
      if (typeof value === 'object') {
        const nestedPrice = findPrice(value);
        if (nestedPrice !== null) return nestedPrice;
      }
    }
    return null;
  };

  const recursivePrice = findPrice(responseData);
  if (recursivePrice !== null) {
    console.log('Found price through recursive search:', recursivePrice);
    return recursivePrice;
  }

  console.log('No valid price found in response');
  return null;
}

serve(async (req) => {
  console.log('Received request:', req.method);

  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiId || !apiSecret) {
      console.error('Missing required environment variables');
      throw new Error('API credentials not configured');
    }

    const requestData = await req.json();
    console.log('Processing request data:', requestData);

    if (!requestData) {
      throw new Error('Request data is required');
    }

    let valuationResult;
    
    if (requestData.isManualEntry) {
      console.log('Processing manual valuation for:', requestData);
      
      if (!requestData.make || !requestData.model || !requestData.year) {
        throw new Error('Make, model, and year are required for manual valuation');
      }

      const checksum = calculateChecksum(apiId, apiSecret, 'MANUAL');
      const baseUrl = 'https://bp.autoiso.pl/api/v3/getManualValuation';
      const url = `${baseUrl}/apiuid:${apiId}/checksum:${checksum}/make:${requestData.make}/model:${requestData.model}/year:${requestData.year}/odometer:${requestData.mileage}/transmission:${requestData.gearbox}/currency:PLN`;

      console.log('Calling manual valuation API:', url);

      const response = await fetch(url);
      console.log('Manual API Response status:', response.status);
      console.log('Manual API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Manual valuation API response:', JSON.stringify(responseData, null, 2));

      const valuationPrice = extractPrice(responseData);
      if (!valuationPrice) {
        throw new Error('Could not determine valuation price from API response');
      }

      valuationResult = {
        make: requestData.make,
        model: requestData.model,
        year: requestData.year,
        vin: '',
        transmission: requestData.gearbox,
        valuation: valuationPrice,
        mileage: requestData.mileage
      };
    } else {
      console.log('Processing VIN-based valuation for:', requestData);

      if (!requestData.vin) {
        throw new Error('VIN is required for VIN-based valuation');
      }

      const checksum = calculateChecksum(apiId, apiSecret, requestData.vin);
      const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${requestData.vin}/odometer:${requestData.mileage}/currency:PLN`;

      console.log('Calling VIN valuation API:', url);

      const response = await fetch(url);
      console.log('VIN API Response status:', response.status);
      console.log('VIN API Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API responded with status: ${response.status}. Response: ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('VIN valuation API response:', JSON.stringify(responseData, null, 2));

      const valuationPrice = extractPrice(responseData);
      if (!valuationPrice) {
        console.error('Failed to extract price from response:', responseData);
        throw new Error('Could not determine valuation price from API response');
      }

      valuationResult = {
        make: responseData?.make || responseData?.functionResponse?.make || 'Not available',
        model: responseData?.model || responseData?.functionResponse?.model || 'Not available',
        year: responseData?.year || responseData?.functionResponse?.year || null,
        vin: requestData.vin,
        transmission: requestData.gearbox,
        valuation: valuationPrice,
        mileage: requestData.mileage
      };
    }

    console.log('Valuation completed successfully:', valuationResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valuation completed successfully',
        data: valuationResult
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Valuation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An error occurred during valuation',
        data: null
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});