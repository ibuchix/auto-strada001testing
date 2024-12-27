import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

// Updated interface to handle multiple possible response structures
interface ValuationResponse {
  status?: string;
  marka?: string;
  manufacturer?: string;
  model?: string;
  model_name?: string;
  rok_produkcji?: string;
  year_of_production?: string;
  skrzynia_biegow?: string;
  transmission?: string;
  rodzaj_paliwa?: string;
  fuel_type?: string;
  wartosc_rynkowa?: string;
  market_value?: string | number;
  vehicle?: {
    make?: string;
    model?: string;
    year?: string | number;
    transmission?: string;
    fuelType?: string;
    value?: string | number;
  };
  message?: string;
}

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

    console.log('Making API request to:', apiUrl);

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

    const responseData: ValuationResponse = await response.json();
    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    if (responseData.status === 'ER') {
      console.error('API Error Status:', responseData);
      throw new Error(responseData.message || 'API returned an error');
    }

    // Updated field mapping with multiple fallbacks
    const valuationResult = {
      make: responseData.marka || responseData.manufacturer || responseData.vehicle?.make || 'Not available',
      model: responseData.model || responseData.model_name || responseData.vehicle?.model || 'Not available',
      year: parseInt(responseData.rok_produkcji || responseData.year_of_production || responseData.vehicle?.year?.toString() || '') || null,
      vin: vin,
      transmission: responseData.skrzynia_biegow || responseData.transmission || responseData.vehicle?.transmission || 'Not available',
      fuelType: responseData.rodzaj_paliwa || responseData.fuel_type || responseData.vehicle?.fuelType || 'Not available',
      valuation: parseFloat(
        (typeof responseData.wartosc_rynkowa === 'string' ? responseData.wartosc_rynkowa.replace(/[^0-9.-]+/g, '') : responseData.wartosc_rynkowa) ||
        responseData.market_value?.toString() ||
        responseData.vehicle?.value?.toString() ||
        '0'
      ) || 0
    };

    console.log('Response Data Structure:', Object.keys(responseData));
    console.log('Vehicle Data Structure:', responseData.vehicle ? Object.keys(responseData.vehicle) : 'No vehicle data');
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