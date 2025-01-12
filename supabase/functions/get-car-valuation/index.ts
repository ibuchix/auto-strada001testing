import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from 'https://deno.land/std/crypto/mod.ts';

const calculateChecksum = (apiId: string, apiSecret: string, vin: string) => {
  const input = `${apiId}${apiSecret}${vin}`;
  const hash = crypto.subtle.digestSync('MD5', new TextEncoder().encode(input));
  const checksum = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return checksum;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage = 50000, gearbox = 'manual', make, model, year, isManualEntry = false } = await req.json();
    console.log('Received request with:', { vin, mileage, gearbox, make, model, year, isManualEntry });
    
    if (!isManualEntry && !vin) throw new Error('VIN number is required');
    if (isManualEntry && (!make || !model || !year)) throw new Error('Make, model, and year are required for manual entry');

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    if (!apiSecret) throw new Error('API configuration error: Missing API secret');

    let apiUrl: string;
    let responseData: any;

    if (isManualEntry) {
      // For manual entry, construct a different API URL with make, model, year
      apiUrl = `https://bp.autoiso.pl/api/v3/getManualValuation/apiuid:${apiId}/make:${make}/model:${model}/year:${year}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
      
      // Calculate checksum differently for manual valuation
      const manualChecksum = calculateChecksum(apiId, apiSecret, `${make}${model}${year}`);
      console.log('Generated manual checksum:', manualChecksum);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'X-API-Key': apiId,
          'X-Checksum': manualChecksum
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Manual API Error Response:', errorText);
        throw new Error(`Manual API request failed: ${response.status} ${response.statusText}`);
      }

      responseData = await response.json();
    } else {
      // Original VIN-based valuation
      const checksum = calculateChecksum(apiId, apiSecret, vin);
      console.log('Generated VIN checksum:', checksum);
      
      apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
      console.log('Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'X-API-Key': apiId,
          'X-Checksum': checksum
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      responseData = await response.json();
    }

    console.log('Raw API Response:', JSON.stringify(responseData, null, 2));

    const valuationResult = {
      success: true,
      data: {
        make: isManualEntry ? make : responseData.functionResponse?.userParams?.make || 'Not available',
        model: isManualEntry ? model : responseData.functionResponse?.userParams?.model || 'Not available',
        year: isManualEntry ? year : responseData.functionResponse?.userParams?.year || null,
        vin: isManualEntry ? null : responseData.vin || vin,
        transmission: gearbox || 'Not available',
        valuation: responseData.functionResponse?.valuation?.calcValuation?.price || 0,
        mileage,
      },
    };

    return new Response(JSON.stringify(valuationResult), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
        data: {
          make: 'Not available',
          model: 'Not available',
          year: null,
          vin: '',
          transmission: 'Not available',
          valuation: 0,
          mileage: 0,
        },
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