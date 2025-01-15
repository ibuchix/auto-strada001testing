import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encode } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManualValuationRequest {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
}

function calculateChecksum(apiId: string, apiSecret: string): string {
  console.log('Calculating checksum for manual entry');
  const input = `${apiId}${apiSecret}MANUAL_ENTRY`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return encode(new Uint8Array(hash));
}

serve(async (req) => {
  console.log('Received manual valuation request:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiId || !apiSecret) {
      throw new Error('API credentials not configured');
    }

    const requestData: ManualValuationRequest = await req.json();
    console.log('Processing manual entry valuation for:', requestData);

    if (!requestData.make || !requestData.model || !requestData.year || !requestData.mileage) {
      throw new Error('Make, model, year, and mileage are required for manual valuation');
    }

    const checksum = calculateChecksum(apiId, apiSecret);
    const transmission = requestData.transmission?.toLowerCase() === 'automatic' ? 'automatic' : 'manual';
    console.log('Using transmission type:', transmission);

    const url = `https://bp.autoiso.pl/api/v3/getManualValuation/apiuid:${apiId}/checksum:${checksum}/make:${requestData.make}/model:${requestData.model}/year:${requestData.year}/odometer:${requestData.mileage}/transmission:${transmission}/currency:PLN`;
    
    console.log('Making API request to:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API responded with status: ${response.status}. Response: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Manual valuation API response:', responseData);

    // Extract price from response
    let valuationPrice = null;
    if (typeof responseData?.price === 'number') valuationPrice = responseData.price;
    else if (typeof responseData?.valuation?.price === 'number') valuationPrice = responseData.valuation.price;
    else if (typeof responseData?.estimated_value === 'number') valuationPrice = responseData.estimated_value;
    else if (typeof responseData?.value === 'number') valuationPrice = responseData.value;

    if (!valuationPrice) {
      console.error('Failed to extract price from response:', responseData);
      throw new Error('Could not determine valuation price from API response');
    }

    const result = {
      make: requestData.make,
      model: requestData.model,
      year: requestData.year,
      transmission: transmission,
      valuation: valuationPrice,
      mileage: requestData.mileage
    };

    console.log('Manual valuation completed successfully:', result);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual valuation completed successfully',
        data: result
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Manual valuation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An error occurred during manual valuation',
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