
/**
 * Direct VIN service
 * Created: 2025-04-20 - Created direct VIN validation service to bypass edge functions
 * Updated: 2025-05-10 - Fixed function signatures and improved API response handling
 */

import { calculateReservePrice } from '@/utils/valuation/valuationCalculator';
import { ValuationData } from '@/utils/valuation/valuationDataTypes';
import { createHash } from 'crypto';

/**
 * Enhanced VIN validation service with direct API integration
 */
export async function validateVinDirectly(
  vin: string,
  mileage: number = 0
): Promise<ValuationData> {
  console.log('Starting direct VIN validation for:', vin);
  
  try {
    const result = await fetchFromAutoIsoApi(vin, mileage);
    
    if (result && result.make && result.model) {
      console.log('Successfully retrieved data from Auto ISO API');
      return transformAutoIsoResponse(result, vin, mileage);
    }
    
    console.log('Primary API returned incomplete data, trying fallback API');
    
    const fallbackResult = await fetchFromFallbackApi(vin);
    return transformFallbackResponse(fallbackResult, vin, mileage);
  } catch (error) {
    console.error('Error in direct VIN validation:', error);
    throw new Error(`VIN validation failed: ${error.message}`);
  }
}

/**
 * Fetch data from Auto ISO API
 */
async function fetchFromAutoIsoApi(vin: string, mileage: number): Promise<any> {
  const API_ID = 'AUTOSTRA';
  const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
  
  // Calculate checksum using native crypto
  const checksum = createHash('md5')
    .update(API_ID + API_SECRET + vin)
    .digest('hex');
  
  const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auto ISO API error:', error);
    throw error;
  }
}

/**
 * Transform Auto ISO API response into standardized format
 */
function transformAutoIsoResponse(
  data: any,
  vin: string,
  mileage: number
): ValuationData {
  // Extract pricing data
  let priceMin = 0;
  let priceMed = 0;

  // Try to extract from nested functionResponse first
  const calcValuation = data.functionResponse?.valuation?.calcValuation;
  if (calcValuation) {
    priceMin = Number(calcValuation.price_min) || 0;
    priceMed = Number(calcValuation.price_med) || 0;
  } else {
    // Fall back to top-level properties
    priceMin = Number(data.price_min) || 0;
    priceMed = Number(data.price_med) || 0;
  }

  // Calculate base price
  const basePrice = priceMin && priceMed
    ? (priceMin + priceMed) / 2
    : Number(data.price) || Number(data.valuation) || 0;

  const valuation = basePrice;
  const reservePrice = calculateReservePrice(basePrice);
  
  // Get vehicle details from nested or direct properties
  const userParams = data.functionResponse?.userParams || {};
  const make = userParams.make || data.make || '';
  const model = userParams.model || data.model || '';
  const year = userParams.year || data.productionYear || data.year || 0;
  
  return {
    vin: vin,
    make: make,
    model: model,
    year: Number(year),
    transmission: 'manual', // Default value, can be updated later
    mileage: mileage,
    valuation: valuation,
    reservePrice: reservePrice,
    averagePrice: Number(priceMed) || valuation,
    basePrice: basePrice,
  };
}

/**
 * Fallback API integration
 * Currently returns basic data structure
 */
async function fetchFromFallbackApi(vin: string): Promise<any> {
  // This is a placeholder for future fallback API integration
  return {
    make: '',
    model: '',
    year: 0,
    error: 'Fallback API not implemented'
  };
}

/**
 * Transform fallback API response into standardized format
 */
function transformFallbackResponse(
  data: any,
  vin: string,
  mileage: number
): ValuationData {
  return {
    vin: vin,
    make: data.make || '',
    model: data.model || '',
    year: Number(data.year) || 0,
    transmission: 'manual',
    mileage: mileage,
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
}
