import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { validateRequest, normalizeData } from './utils/validation.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const requestData = await req.json();
    console.log('Raw request data:', requestData);

    const normalizedData = normalizeData(requestData);
    console.log('Normalized data:', normalizedData);

    const validationResult = validateRequest(normalizedData);
    console.log('Validation result:', validationResult);

    if (!validationResult.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Validation failed: ${validationResult.errors.join(', ')}`,
          data: null
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Mock valuation calculation for testing
    const mockValuation = {
      success: true,
      message: 'Valuation completed successfully',
      data: {
        make: normalizedData.make,
        model: normalizedData.model,
        year: normalizedData.year,
        mileage: normalizedData.mileage,
        transmission: normalizedData.transmission,
        fuel: normalizedData.fuel,
        country: normalizedData.country,
        valuation: Math.floor(Math.random() * 50000) + 10000, // Random value between 10000 and 60000
        currency: normalizedData.country === 'PL' ? 'PLN' : 'EUR'
      }
    };

    return new Response(
      JSON.stringify(mockValuation),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        data: null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});