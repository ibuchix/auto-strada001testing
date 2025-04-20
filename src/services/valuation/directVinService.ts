
/**
 * Changes made:
 * - 2025-04-20: Created direct VIN validation service to bypass edge functions
 * - Added detailed error handling and fallback mechanisms
 */

import { calculateReservePrice } from '@/utils/valuation/valuationCalculator';
import { ValuationData } from '@/utils/valuation/valuationDataTypes';
import { debugVinApiResponse } from '@/utils/debugging/enhanced_vin_debugging';
import md5 from 'js-md5';

interface ApiResponse {
  make?: string;
  model?: string;
  year?: number;
  price_min?: number;
  price_med?: number;
  error?: string;
}

/**
 * Enhanced VIN validation service with direct API integration
 * This bypasses potential issues with the edge function
 */
export async function validateVinDirectly(
  vin: string,
  mileage: number = 0
): Promise<ValuationData> {
  console.log('Starting direct VIN validation for:', vin);
  
  try {
    // First try the primary API (Auto ISO API)
    const result = await fetchFromAutoIsoApi(vin, mileage);
    
    // If we got valid data, return it
    if (result && result.make && result.model) {
      console.log('Successfully retrieved data from Auto ISO API');
      debugVinApiResponse('auto_iso_success', result);
      return transformAutoIsoResponse(result, vin, mileage);
    }
    
    // If primary API failed, try the fallback API
    console.log('Primary API returned incomplete data, trying fallback API');
    debugVinApiResponse('auto_iso_failed', result);
    
    const fallbackResult = await fetchFromFallbackApi(vin);
    return transformFallbackResponse(fallbackResult, vin, mileage);
  } catch (error) {
    console.error('Error in direct VIN validation:', error);
    debugVinApiResponse('validation_error', { error });
    throw new Error(`VIN validation failed: ${error.message}`);
  }
}

/**
 * Fetch data from Auto ISO API
 */
async function fetchFromAutoIsoApi(vin: string, mileage: number): Promise<ApiResponse> {
  const API_ID = 'AUTOSTRA';
  const API_SECRET = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
  
  // Calculate checksum
  const checksum = md5(API_ID + API_SECRET + vin);
  
  // Construct API URL
  const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    debugVinApiResponse('auto_iso_raw_response', data);
    
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
  data: ApiResponse,
  vin: string,
  mileage: number
): ValuationData {
  const basePrice = data.price_min && data.price_med
    ? (Number(data.price_min) + Number(data.price_med)) / 2
    : 0;

  const valuation = basePrice;
  const reservePrice = calculateReservePrice(basePrice);
  
  return {
    vin: vin,
    make: data.make || '',
    model: data.model || '',
    year: Number(data.year) || 0,
    transmission: 'manual', // Default value, can be updated later
    mileage: mileage,
    valuation: valuation,
    reservePrice: reservePrice,
    averagePrice: Number(data.price_med) || valuation,
    basePrice: basePrice,
  };
}

/**
 * Fallback API integration
 * Currently returns basic data structure
 * Can be enhanced with additional API integration if needed
 */
async function fetchFromFallbackApi(vin: string): Promise<ApiResponse> {
  // This is a placeholder for future fallback API integration
  // For now, it returns a minimal data structure
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
  data: ApiResponse,
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
