import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from 'https://deno.land/std/crypto/mod.ts';

const calculateChecksum = async (apiId: string, apiSecret: string, input: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiId + apiSecret + input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
  // Handle CORS preflight requests
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
    let checksum: string;

    if (isManualEntry) {
      const validationErrors = validateManualEntry({ make, model, year, mileage, transmission: gearbox });
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      checksum = await calculateChecksum(apiId, apiSecret, `${make}${model}${year}`);
      const encodedMake = encodeURIComponent(make);
      const encodedModel = encodeURIComponent(model);
      
      apiUrl = `https://bp.autoiso.pl/api/v3/getManualValuation/apiuid:${apiId}/make:${encodedMake}/model:${encodedModel}/year:${year}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard/checksum:${checksum}`;
      
      console.log('Manual valuation request URL:', apiUrl);
    } else {
      if (!vin || typeof vin !== 'string' || vin.length < 10) {
        throw new Error('Invalid VIN number');
      }

      checksum = await calculateChecksum(apiId, apiSecret, vin);
      apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN/lang:pl/country:PL/condition:good/equipment_level:standard`;
      
      console.log('VIN valuation request URL:', apiUrl);
    }

    const headers = {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'X-API-Key': apiId,
      'X-Checksum': checksum,
    };
    
    console.log('Making API request with headers:', headers);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers
    });

    const responseText = await response.text();
    console.log('Raw API response:', responseText);

    if (!response.ok) {
      console.error('API Error Response:', responseText, 'Status:', response.status);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed API response:', responseData);
    } catch (error) {
      console.error('Failed to parse API response:', error);
      throw new Error('Invalid JSON response from valuation service');
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