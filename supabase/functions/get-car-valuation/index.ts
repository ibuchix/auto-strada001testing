import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from 'https://deno.land/std/crypto/mod.ts';

const calculateChecksum = async (apiId: string, apiSecret: string, input: string) => {
  console.log('Calculating checksum with input:', input);
  const encoder = new TextEncoder();
  const data = encoder.encode(apiId + apiSecret + input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  console.log('Generated checksum:', checksum);
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
    console.log('Received request:', { vin, mileage, gearbox, make, model, year, isManualEntry });

    const apiId = 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    
    if (!apiSecret) {
      console.error('API configuration error: Missing API secret');
      throw new Error('API configuration error: Missing API secret');
    }

    let apiUrl: string;
    let checksum: string;

    if (isManualEntry) {
      const validationErrors = validateManualEntry({ make, model, year, mileage, transmission: gearbox });
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      const manualInput = `${make}${model}${year}${mileage}`;
      checksum = await calculateChecksum(apiId, apiSecret, manualInput);
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

    // Check for specific error responses from the API
    if (responseData.error) {
      console.error('API returned error:', responseData.error);
      throw new Error(responseData.error.message || 'API returned an error');
    }

    // Extract valuation price from response
    let valuationPrice;
    
    // Log the response structure for debugging
    console.log('Response structure:', {
      functionResponse: responseData.functionResponse,
      valuation: responseData.valuation,
      price: responseData.price,
      data: responseData.data
    });

    // Try to extract price from various possible response structures
    if (responseData?.functionResponse?.valuation?.calcValuation?.price) {
      valuationPrice = responseData.functionResponse.valuation.calcValuation.price;
      console.log('Found price in calcValuation:', valuationPrice);
    } else if (responseData?.valuation?.price) {
      valuationPrice = responseData.valuation.price;
      console.log('Found price in valuation:', valuationPrice);
    } else if (responseData?.price) {
      valuationPrice = responseData.price;
      console.log('Found direct price:', valuationPrice);
    } else if (responseData?.data?.price) {
      valuationPrice = responseData.data.price;
      console.log('Found price in data:', valuationPrice);
    } else if (responseData?.functionResponse?.price) {
      valuationPrice = responseData.functionResponse.price;
      console.log('Found price in functionResponse:', valuationPrice);
    }

    if (!valuationPrice) {
      console.error('Could not find valuation price. Full response:', JSON.stringify(responseData, null, 2));
      throw new Error('Could not find valuation price in API response');
    }

    // Extract make and model from response
    const extractedMake = isManualEntry ? make : responseData?.functionResponse?.userParams?.make || responseData?.make || 'Not available';
    const extractedModel = isManualEntry ? model : responseData?.functionResponse?.userParams?.model || responseData?.model || 'Not available';
    const extractedYear = isManualEntry ? year : responseData?.functionResponse?.userParams?.year || responseData?.year || null;

    const valuationResult = {
      success: true,
      data: {
        make: extractedMake,
        model: extractedModel,
        year: extractedYear,
        vin: isManualEntry ? null : vin,
        transmission: gearbox,
        valuation: valuationPrice,
        mileage,
      },
    };

    console.log('Returning valuation result:', valuationResult);

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