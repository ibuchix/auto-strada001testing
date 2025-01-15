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

function sanitizeData(data: any): ManualValuationRequest {
  return {
    make: String(data.make || '').trim(),
    model: String(data.model || '').trim(),
    year: Number(data.year),
    mileage: Number(data.mileage),
    fuel: String(data.fuel || '').trim().toLowerCase(),
    country: String(data.country || '').trim().toUpperCase(),
    transmission: String(data.transmission || '').trim().toLowerCase(),
  };
}

function calculateChecksum(apiId: string, apiSecret: string, make: string, model: string): string {
  console.log('Calculating checksum for manual entry:', { make, model });
  const input = `${apiId}${apiSecret}${make}${model}`;
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  return encode(new Uint8Array(hash));
}

function validateRequest(data: ManualValuationRequest) {
  console.log('Validating request data:', JSON.stringify(data, null, 2));
  
  const errors = [];
  if (!data.make?.trim()) errors.push('Make is required');
  if (!data.model?.trim()) errors.push('Model is required');
  if (!data.year || isNaN(data.year) || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push('Invalid year');
  }
  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0) {
    errors.push('Invalid mileage');
  }
  
  const validTransmissions = ['manual', 'automatic'];
  if (!validTransmissions.includes(data.transmission)) {
    errors.push('Invalid transmission type');
  }
  
  const validFuelTypes = ['petrol', 'diesel', 'electric', 'hybrid'];
  console.log('Checking fuel type:', data.fuel, 'Valid types:', validFuelTypes);
  if (!validFuelTypes.includes(data.fuel)) {
    errors.push('Invalid fuel type');
  }
  
  const validCountries = ['PL', 'DE', 'UK'];
  console.log('Checking country:', data.country, 'Valid countries:', validCountries);
  if (!validCountries.includes(data.country)) {
    errors.push('Invalid country');
  }
  
  if (errors.length > 0) {
    console.error('Validation errors:', errors);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
}

serve(async (req) => {
  console.log('Received request:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiId || !apiSecret) {
      console.error('API credentials not configured');
      throw new Error('API credentials not configured');
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const rawRequestData = await req.json();
    console.log('Raw request data:', rawRequestData);

    // Sanitize and convert types for the input data
    const requestData = sanitizeData(rawRequestData);
    console.log('Sanitized request data:', requestData);

    // Validate sanitized data
    validateRequest(requestData);

    const checksum = calculateChecksum(apiId, apiSecret, requestData.make, requestData.model);
    
    // Construct URL with sanitized parameters
    const url = `https://bp.autoiso.pl/api/v3/getManualValuation/apiuid:${apiId}/checksum:${checksum}/make:${encodeURIComponent(requestData.make)}/model:${encodeURIComponent(requestData.model)}/year:${requestData.year}/odometer:${requestData.mileage}/transmission:${requestData.transmission}/currency:PLN/country:${requestData.country}/fuel:${requestData.fuel}`;
    
    console.log('Making API request to:', url);
    
    const response = await fetch(url);
    const responseText = await response.text();
    console.log('Raw API Response:', responseText);
    
    if (!response.ok) {
      console.error('API Error Response:', responseText);
      throw new Error(`API responded with status: ${response.status}. Response: ${responseText}`);
    }
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse API response:', e);
      throw new Error('Invalid response from valuation API');
    }

    // Check for API-specific error responses
    if (responseData.apiStatus === 'ER') {
      console.error('API returned error:', responseData.message);
      throw new Error(`API Error: ${responseData.message}`);
    }

    // Extract price from response
    let valuationPrice = null;
    if (responseData && typeof responseData === 'object') {
      console.log('Attempting to extract price from response structure:', JSON.stringify(responseData));
      
      if (typeof responseData.price === 'number') {
        valuationPrice = responseData.price;
      } else if (responseData.valuation && typeof responseData.valuation.price === 'number') {
        valuationPrice = responseData.valuation.price;
      } else if (typeof responseData.estimated_value === 'number') {
        valuationPrice = responseData.estimated_value;
      } else if (typeof responseData.value === 'number') {
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
      transmission: requestData.transmission,
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