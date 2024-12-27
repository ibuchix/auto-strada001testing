import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Input string for checksum:', input);

  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
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
    const { registration: vin } = await req.json();
    console.log('Received VIN:', vin);

    if (!vin) {
      throw new Error('VIN number is required');
    }

    // Using hardcoded API ID as per documentation
    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiSecret) {
      throw new Error('API configuration error: Missing API secret');
    }

    console.log('Using API ID:', apiId);

    const checksum = calculateChecksum(apiId, apiSecret, vin);
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:50000/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;

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

    if (responseData.apiStatus === 'ER') {
      console.error('API Error Status:', responseData);
      throw new Error(responseData.message || 'API returned an error');
    }

    // Extract data from the response
    const valuationResult = {
      make: responseData.marka || responseData.manufacturer || 'Not available',
      model: responseData.model || 'Not available',
      year: responseData.rok_produkcji || responseData.year || null,
      vin: vin,
      transmission: responseData.skrzynia_biegow || responseData.transmission_type || 'Not available',
      fuelType: responseData.rodzaj_paliwa || responseData.fuel_type || 'Not available',
      valuation: responseData.wartosc_rynkowa || responseData.market_value || 0
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