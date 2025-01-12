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
  console.log('Extracting price from:', JSON.stringify(responseData, null, 2));

  if (typeof responseData?.price === 'number') return responseData.price;
  if (typeof responseData?.valuation?.price === 'number') return responseData.valuation.price;
  if (typeof responseData?.functionResponse?.price === 'number') return responseData.functionResponse.price;
  if (typeof responseData?.functionResponse?.valuation?.price === 'number') {
    return responseData.functionResponse.valuation.price;
  }

  // Recursive search for price field
  const findPrice = (obj: any): number | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('price') && typeof value === 'number') {
        return value;
      }
      if (typeof value === 'object') {
        const nestedPrice = findPrice(value);
        if (nestedPrice !== null) return nestedPrice;
      }
    }
    return null;
  };

  return findPrice(responseData);
}

serve(async (req) => {
  console.log('Received request:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify environment variables
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
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Manual valuation API response:', responseData);

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
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('VIN valuation API response:', responseData);

      const valuationPrice = extractPrice(responseData);
      if (!valuationPrice) {
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