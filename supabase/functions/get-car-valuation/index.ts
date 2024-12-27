import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from 'https://deno.land/std/crypto/mod.ts';

const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Input string for checksum:', input);

  const hash = crypto.subtle.digestSync('MD5', new TextEncoder().encode(input));
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
    const { registration: vin, mileage = 50000, gearbox = 'manual' } = await req.json();
    console.log('Received VIN:', vin);
    console.log('Received mileage:', mileage);
    console.log('Received gearbox:', gearbox);

    if (!vin) {
      throw new Error('VIN number is required');
    }

    // Validate gearbox input
    if (!['manual', 'automatic'].includes(gearbox)) {
      throw new Error('Invalid gearbox type. Must be either "manual" or "automatic"');
    }

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiSecret) {
      throw new Error('API configuration error: Missing API secret');
    }

    const checksum = calculateChecksum(apiId, apiSecret, vin);
    
    // Include gearbox in the API URL and ensure it's properly formatted
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard/gearbox:${gearbox}`;

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
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}. Details: ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    // Apply gearbox-based price adjustment
    let baseValuation = responseData.functionResponse?.valuation?.calcValuation?.price || 0;
    
    // Adjust price based on gearbox type (automatic typically commands a premium)
    const gearboxMultiplier = gearbox === 'automatic' ? 1.1 : 1.0; // 10% premium for automatic
    const adjustedValuation = Math.round(baseValuation * gearboxMultiplier);

    console.log('Base valuation:', baseValuation);
    console.log('Gearbox multiplier:', gearboxMultiplier);
    console.log('Adjusted valuation:', adjustedValuation);

    // Map the API response to the frontend format with adjusted valuation
    const valuationResult = {
      make: responseData.functionResponse?.userParams?.make || 'Not available',
      model: responseData.functionResponse?.userParams?.model || 'Not available',
      year: responseData.functionResponse?.userParams?.year || null,
      vin: responseData.vin || vin,
      transmission: gearbox,
      fuelType: responseData.functionResponse?.userParams?.fuel || 'Not available',
      valuation: adjustedValuation,
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