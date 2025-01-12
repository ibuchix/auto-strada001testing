import { createHash } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { ValuationRequest, ValuationResponse } from "../types.ts";
import { extractPrice } from "../utils/priceExtractor.ts";

const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  const input = `${apiId}${apiSecret}${vin}`;
  return createHash('md5').update(input).toString();
};

export const handleManualValuation = async (data: ValuationRequest): Promise<ValuationResponse> => {
  console.log('Processing manual valuation for:', data);

  const apiId = Deno.env.get('CAR_API_ID');
  const apiSecret = Deno.env.get('CAR_API_SECRET');

  if (!apiId || !apiSecret) {
    throw new Error('API credentials not configured');
  }

  const checksum = calculateChecksum(apiId, apiSecret, 'MANUAL');
  const baseUrl = 'https://bp.autoiso.pl/api/v3/getManualValuation';
  
  const url = `${baseUrl}/apiuid:${apiId}/checksum:${checksum}/make:${data.make}/model:${data.model}/year:${data.year}/odometer:${data.mileage}/transmission:${data.gearbox}/currency:PLN`;

  console.log('Calling manual valuation API:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Manual valuation API response:', responseData);

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

export const handleVinValuation = async (data: ValuationRequest): Promise<ValuationResponse> => {
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
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('VIN valuation API response:', responseData);

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