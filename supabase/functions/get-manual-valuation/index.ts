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
  fuel: string;
  country: string;
}

function calculateChecksum(apiId: string, apiSecret: string, make: string, model: string): string {
  console.log('Calculating checksum for manual entry');
  const input = `${apiId}${apiSecret}${make}${model}`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return encode(new Uint8Array(hash));
}

function validateRequest(data: ManualValuationRequest) {
  if (!data.make?.trim()) throw new Error('Make is required');
  if (!data.model?.trim()) throw new Error('Model is required');
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    throw new Error('Invalid year');
  }
  if (!data.mileage || data.mileage < 0) throw new Error('Invalid mileage');
  if (!['manual', 'automatic'].includes(data.transmission?.toLowerCase())) {
    throw new Error('Invalid transmission type');
  }
  if (!['petrol', 'diesel', 'electric', 'hybrid'].includes(data.fuel?.toLowerCase())) {
    throw new Error('Invalid fuel type');
  }
  if (!['PL', 'DE', 'UK'].includes(data.country)) {
    throw new Error('Invalid country');
  }
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

    // Validate request data
    validateRequest(requestData);

    const checksum = calculateChecksum(apiId, apiSecret, requestData.make, requestData.model);
    const transmission = requestData.transmission?.toLowerCase() === 'automatic' ? 'automatic' : 'manual';
    console.log('Using transmission type:', transmission);

    // Construct URL with all required parameters
    const url = `https://bp.autoiso.pl/api/v3/getManualValuation/apiuid:${encodeURIComponent(apiId)}/checksum:${encodeURIComponent(checksum)}/make:${encodeURIComponent(requestData.make)}/model:${encodeURIComponent(requestData.model)}/year:${encodeURIComponent(requestData.year)}/odometer:${encodeURIComponent(requestData.mileage)}/transmission:${encodeURIComponent(transmission)}/currency:PLN/country:${encodeURIComponent(requestData.country)}/fuel:${encodeURIComponent(requestData.fuel)}`;
    
    console.log('Making API request to:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API responded with status: ${response.status}. Response: ${errorText}`);
    }
    
    const responseData = await response.json();
    console.log('Manual valuation API response:', responseData);

    // Check for API-specific error responses
    if (responseData.apiStatus === 'ER') {
      console.error('API returned error:', responseData.message);
      throw new Error(`API Error: ${responseData.message}`);
    }

    // Extract price from response with more detailed logging
    let valuationPrice = null;
    if (responseData && typeof responseData === 'object') {
      console.log('Attempting to extract price from response structure:', JSON.stringify(responseData));
      
      if (typeof responseData.price === 'number') {
        console.log('Found price directly in response');
        valuationPrice = responseData.price;
      } else if (responseData.valuation && typeof responseData.valuation.price === 'number') {
        console.log('Found price in valuation object');
        valuationPrice = responseData.valuation.price;
      } else if (typeof responseData.estimated_value === 'number') {
        console.log('Found price in estimated_value');
        valuationPrice = responseData.estimated_value;
      } else if (typeof responseData.value === 'number') {
        console.log('Found price in value');
        valuationPrice = responseData.value;
      }
    }

    if (!valuationPrice && valuationPrice !== 0) {
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