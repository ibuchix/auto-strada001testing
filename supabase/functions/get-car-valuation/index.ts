import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "https://deno.land/std@0.177.0/crypto/mod.ts";

interface ValuationRequest {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage: number;
  gearbox: string;
  isManualEntry?: boolean;
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
  console.log('API Response:', JSON.stringify(responseData, null, 2));

  // Direct price field
  if (typeof responseData?.price === 'number') {
    return responseData.price;
  }

  // Check valuation object
  if (typeof responseData?.valuation?.price === 'number') {
    return responseData.valuation.price;
  }

  // Check functionResponse object
  if (typeof responseData?.functionResponse?.price === 'number') {
    return responseData.functionResponse.price;
  }

  // Check nested valuation object
  if (typeof responseData?.functionResponse?.valuation?.price === 'number') {
    return responseData.functionResponse.valuation.price;
  }

  // Check for any numeric price field recursively
  const findPrice = (obj: any): number | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('price') && typeof value === 'number') {
        return value;
      }
      if (typeof value === 'object') {
        const nestedPrice = findPrice(value);
        if (nestedPrice !== null) return nestedPrice;
      }
    }
    return null;
  };

  return findPrice(responseData);
};

const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const input = `${apiId}${apiSecret}${vin}`;
  return createHash('md5').update(input).toString();
};

const handleManualValuation = async (data: ValuationRequest): Promise<ValuationResponse> => {
  console.log('Processing manual valuation for:', data);

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

  try {
    const response = await fetch(url);
    const responseData = await response.json();
    console.log('Manual valuation API response:', JSON.stringify(responseData, null, 2));

    const valuationPrice = extractPrice(responseData);
    if (!valuationPrice) {
      console.error('Could not determine valuation price from API response:', responseData);
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
  } catch (error) {
    console.error('Manual valuation API error:', error);
    throw error;
  }
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

  try {
    const response = await fetch(url);
    const responseData = await response.json();
    console.log('VIN valuation API response:', JSON.stringify(responseData, null, 2));

    const valuationPrice = extractPrice(responseData);
    if (!valuationPrice) {
      console.error('Could not determine valuation price from API response:', responseData);
      throw new Error('Could not determine valuation price from API response');
    }

    return {
      make: responseData?.make || responseData?.functionResponse?.make || 'Not available',
      model: responseData?.model || responseData?.functionResponse?.model || 'Not available',
      year: responseData?.year || responseData?.functionResponse?.year || null,
      vin: data.vin,
      transmission: data.gearbox || 'Not available',
      valuation: valuationPrice,
      mileage: data.mileage
    };
  } catch (error) {
    console.error('VIN valuation API error:', error);
    throw error;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData: ValuationRequest = await req.json();
    console.log('Received valuation request:', requestData);

    const valuationResult = requestData.isManualEntry 
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