import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { normalizeData, validateRequest } from "./utils/validation.ts";
import { calculateChecksum, fetchValuation } from "./utils/api.ts";
import { ManualValuationRequest } from "./types/validation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Normalize and validate the data
    const normalizedData = normalizeData(rawRequestData);
    console.log('Normalized data:', normalizedData);
    
    const validationResult = validateRequest(normalizedData);
    if (!validationResult.isValid) {
      console.error('Validation errors:', validationResult.errors);
      throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
    }

    const data = normalizedData as ManualValuationRequest;
    const checksum = calculateChecksum(apiId, apiSecret, data.make, data.model);
    const response = await fetchValuation(apiId, checksum, data);
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

    if (responseData.apiStatus === 'ER') {
      console.error('API returned error:', responseData.message);
      throw new Error(`API Error: ${responseData.message}`);
    }

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
      make: data.make,
      model: data.model,
      year: data.year,
      transmission: data.transmission,
      valuation: valuationPrice,
      mileage: data.mileage
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