import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.177.0/hash/mod.ts";

interface ValuationRequest {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage: number;
  gearbox: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValuationResponse {
  make: string;
  model: string;
  year: number | null;
  vin: string;
  transmission: string;
  valuation: number;
  mileage: number;
}

const extractPrice = (responseData: any): number | null => {
  const pricePaths = [
    'price',
    'valuation.price',
    'functionResponse.price',
    'functionResponse.valuation.price',
    'functionResponse.valuation.calcValuation.price'
  ];

  for (const path of pricePaths) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], responseData);
    if (typeof value === 'number') {
      console.log(`Found price at path ${path}:`, value);
      return value;
    }
  }

  return null;
};

const validateManualEntry = (data: Partial<ValuationRequest>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.make?.trim()) {
    errors.push({ field: 'make', message: 'Make is required' });
  }
  if (!data.model?.trim()) {
    errors.push({ field: 'model', message: 'Model is required' });
  }
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear()) {
    errors.push({ field: 'year', message: 'Invalid year' });
  }
  if (!data.mileage || data.mileage < 0) {
    errors.push({ field: 'mileage', message: 'Invalid mileage' });
  }
  if (!data.gearbox || !['manual', 'automatic'].includes(data.gearbox.toLowerCase())) {
    errors.push({ field: 'gearbox', message: 'Invalid transmission type' });
  }

  return errors;
};

const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const input = `${apiId}${apiSecret}${vin}`;
  return createHash('md5').update(input).toString();
};

const handleManualValuation = async (data: ValuationRequest): Promise<ValuationResponse> => {
  console.log('Processing manual valuation for:', data);

  const errors = validateManualEntry(data);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
  }

  // For manual valuations, we'll use a simplified API call
  const apiId = Deno.env.get('CAR_API_ID');
  const apiSecret = Deno.env.get('CAR_API_SECRET');

  if (!apiId || !apiSecret) {
    throw new Error('API credentials not configured');
  }

  // Use a default VIN for manual valuations
  const checksum = calculateChecksum(apiId, apiSecret, 'MANUAL');
  const baseUrl = 'https://bp.autoiso.pl/api/v3/getManualValuation';
  
  const url = `${baseUrl}/apiuid:${apiId}/checksum:${checksum}/make:${data.make}/model:${data.model}/year:${data.year}/odometer:${data.mileage}/transmission:${data.gearbox}/currency:PLN`;

  console.log('Calling manual valuation API:', url);

  const response = await fetch(url);
  const responseData = await response.json();

  console.log('Manual valuation API response:', responseData);

  const valuationPrice = extractPrice(responseData);
  if (!valuationPrice) {
    throw new Error('Could not determine valuation price from API response');
  }

  return {
    make: data.make || 'Not available',
    model: data.model || 'Not available',
    year: data.year || null,
    vin: '',
    transmission: data.gearbox || 'Not available',
    valuation: valuationPrice,
    mileage: data.mileage
  };
};

const handleVinValuation = async (data: ValuationRequest): Promise<ValuationResponse> => {
  console.log('Processing VIN-based valuation for:', data);

  if (!data.vin) {
    throw new Error('VIN is required for VIN-based valuation');
  }

  const apiId = Deno.env.get('CAR_API_ID');
  const apiSecret = Deno.env.get('CAR_API_SECRET');

  if (!apiId || !apiSecret) {
    throw new Error('API credentials not configured');
  }

  const checksum = calculateChecksum(apiId, apiSecret, data.vin);
  const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${data.vin}/odometer:${data.mileage}/currency:PLN`;

  console.log('Calling VIN valuation API:', url);

  const response = await fetch(url);
  const responseData = await response.json();

  console.log('VIN valuation API response:', responseData);

  const valuationPrice = extractPrice(responseData);
  if (!valuationPrice) {
    throw new Error('Could not determine valuation price from API response');
  }

  // Extract vehicle details from response
  const make = responseData?.make || responseData?.functionResponse?.make || 'Not available';
  const model = responseData?.model || responseData?.functionResponse?.model || 'Not available';
  const year = responseData?.year || responseData?.functionResponse?.year || null;

  return {
    make,
    model,
    year,
    vin: data.vin,
    transmission: data.gearbox || 'Not available',
    valuation: valuationPrice,
    mileage: data.mileage
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: ValuationRequest = await req.json();
    console.log('Received valuation request:', requestData);

    const isManualEntry = !requestData.vin;
    const valuationResult = isManualEntry 
      ? await handleManualValuation(requestData)
      : await handleVinValuation(requestData);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Valuation completed successfully',
        data: valuationResult
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Valuation error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'An error occurred during valuation',
        data: {
          make: 'Not available',
          model: 'Not available',
          year: null,
          vin: '',
          transmission: 'Not available',
          valuation: 0,
          mileage: 0
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});