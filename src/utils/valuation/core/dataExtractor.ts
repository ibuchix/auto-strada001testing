
/**
 * Vehicle data extraction utility
 * Created: 2025-04-23
 * Updated: 2025-04-23 - Enhanced nested data extraction with better debugging
 * Updated: 2025-04-24 - Fixed deep path traversal for complex API responses
 */

import { ValuationData } from '../valuationDataTypes';

/**
 * Extract vehicle data from API response with robust nested data handling
 */
export function extractVehicleData(rawData: any) {
  // Debug the incoming structure
  console.log('[DATA-EXTRACTOR] Analyzing API response structure:', {
    hasData: !!rawData,
    topLevelKeys: rawData ? Object.keys(rawData) : [],
    hasFunctionResponse: !!rawData?.functionResponse,
    hasData: !!rawData?.data
  });
  
  // Check for different possible paths where data might be located
  const userParams = rawData?.functionResponse?.userParams || 
                    rawData?.data?.functionResponse?.userParams;
  
  console.log('[DATA-EXTRACTOR] User params found:', {
    hasUserParams: !!userParams,
    userParamsData: userParams,
    userParamsKeys: userParams ? Object.keys(userParams) : []
  });
  
  if (!userParams) {
    console.warn('[DATA-EXTRACTOR] No userParams found in API response - checking data directly');
    
    // Try direct approach for different data structures
    const make = rawData?.make || rawData?.data?.make || '';
    const model = rawData?.model || rawData?.data?.model || '';
    const year = Number(rawData?.year || rawData?.data?.year) || 0;
    const mileage = Number(rawData?.mileage || rawData?.data?.mileage) || 0;
    const transmission = rawData?.transmission || rawData?.data?.transmission || 'manual';
    const vin = rawData?.vin || rawData?.data?.vin || '';
    
    const extractedData = {
      make,
      model,
      year,
      transmission,
      vin,
      mileage
    };

    console.log('[DATA-EXTRACTOR] Extracted vehicle data from direct fields:', extractedData);
    
    return extractedData;
  }
  
  // Extract data from userParams (most accurate source)
  const extractedData = {
    make: userParams.make || '',
    model: userParams.model || '',
    year: Number(userParams.year) || 0,
    transmission: userParams.gearbox || 'manual',
    vin: rawData.vin || rawData.data?.vin || '',
    mileage: Number(userParams.odometer) || 0
  };

  console.log('[DATA-EXTRACTOR] Extracted vehicle data from userParams:', extractedData);
  
  return extractedData;
}

export function sanitizePartialData(data: Partial<ValuationData>): Partial<ValuationData> {
  return {
    make: data.make?.trim(),
    model: data.model?.trim(),
    year: data.year,
    vin: data.vin?.trim(),
    transmission: data.transmission,
    mileage: data.mileage,
    valuation: data.valuation,
    reservePrice: data.reservePrice,
    averagePrice: data.averagePrice,
    basePrice: data.basePrice
  };
}
