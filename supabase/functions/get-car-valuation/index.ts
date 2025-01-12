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

const validateManualEntry = (data: any) => {
  const currentYear = new Date().getFullYear();
  const errors = [];

  if (!data.make || typeof data.make !== 'string' || data.make.length < 2) {
    errors.push('Invalid make');
  }
  if (!data.model || typeof data.model !== 'string' || data.model.length < 2) {
    errors.push('Invalid model');
  }
  if (!data.year || isNaN(data.year) || data.year < 1900 || data.year > currentYear) {
    errors.push('Invalid year');
  }
  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0 || data.mileage > 999999) {
    errors.push('Invalid mileage');
  }
  if (!data.transmission || !['manual', 'automatic'].includes(data.transmission)) {
    errors.push('Invalid transmission type');
  }

  return errors;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vin, mileage = 50000, gearbox = 'manual', make, model, year, isManualEntry = false } = await req.json();
    console.log('Received request with:', { vin, mileage, gearbox, make, model, year, isManualEntry });

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    
    if (!apiSecret) {
      console.error('API configuration error: Missing API secret');
      throw new Error('API configuration error: Missing API secret');
    }

    console.log('API Configuration:', { apiId, hasApiSecret: !!apiSecret });
    
    let apiUrl: string;
    let responseData: any;

    if (isManualEntry) {
      const validationErrors = validateManualEntry({ make, model, year, mileage, transmission: gearbox });
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      apiUrl = `https://bp.autoiso.pl/api/v3/getManualValuation/apiuid:${apiId}/make:${make}/model:${model}/year:${year}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
      
      const manualChecksum = calculateChecksum(apiId, apiSecret, `${make}${model}${year}`);
      console.log('Manual valuation request:', { apiUrl, checksum: manualChecksum });
      
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
      console.log('Manual valuation response:', responseData);
    } else {
      if (!vin || typeof vin !== 'string' || vin.length < 10) {
        throw new Error('Invalid VIN number');
      }

      const checksum = calculateChecksum(apiId, apiSecret, vin);
      console.log('VIN valuation request:', { vin, checksum });
      
      apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
      
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
        console.error('VIN API Error Response:', errorText, 'Status:', response.status);
        throw new Error(`VIN API request failed: ${response.status} ${response.statusText}`);
      }

      responseData = await response.json();
      console.log('VIN valuation response:', responseData);
    }

    if (!responseData?.functionResponse?.valuation?.calcValuation?.price) {
      console.error('Invalid response structure:', responseData);
      throw new Error('Unable to calculate valuation. Invalid response from valuation service.');
    }

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
        message: error.message || 'Unable to calculate valuation. Please try again or contact support.',
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