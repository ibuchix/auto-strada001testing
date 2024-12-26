import { corsHeaders } from '../_shared/cors.ts'
import { crypto } from "https://deno.land/std/crypto/mod.ts";

const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  const input = `${apiId}${apiSecret}${vin}`;
  console.log('Input string for checksum:', input);
  
  const hash = crypto.subtle.digestSync("MD5", new TextEncoder().encode(input));
  const checksum = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
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

    const apiId = Deno.env.get('CAR_API_ID');
    const apiSecret = Deno.env.get('CAR_API_SECRET');

    if (!apiId || !apiSecret) {
      console.error('Missing API credentials');
      throw new Error('API configuration error');
    }

    const checksum = calculateChecksum(apiId, apiSecret, vin);
    
    // Changed lang parameter from 'en' to 'pl' for Polish language
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:50000/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
    
    console.log('Making API request to:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    console.log('API Response:', responseData);

    // Check for API-specific error responses
    if (responseData.apiStatus === 'ER') {
      console.error('API returned error:', responseData);
      throw new Error(responseData.message || 'API returned an error');
    }

    // Transform the API response into our expected format
    const valuationResult = {
      make: responseData.manufacturer || responseData.make || responseData.marka || 'Not available',
      model: responseData.model || responseData.model_name || 'Not available',
      year: responseData.year_of_production || responseData.year || responseData.rok_produkcji || null,
      vin: vin,
      transmission: responseData.transmission_type || responseData.transmission || responseData.skrzynia_biegow || 'Not available',
      fuelType: responseData.fuel_type || responseData.fuelType || responseData.rodzaj_paliwa || 'Not available',
      valuation: responseData.market_value || responseData.value || responseData.wartosc_rynkowa || 0
    };

    return new Response(JSON.stringify(valuationResult), { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
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
        valuation: 0
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});