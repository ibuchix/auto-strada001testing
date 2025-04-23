
/**
 * Vehicle data extraction utility
 * Created: 2025-04-23
 * Updated: 2025-04-23 - Strict nested data extraction implementation
 */

import { ValuationData } from '../valuationDataTypes';

export function extractVehicleData(rawData: any) {
  // Get data from userParams (most accurate source)
  const userParams = rawData?.functionResponse?.userParams;
  
  console.log('[DATA-EXTRACTOR] Extracting from API response:', {
    hasUserParams: !!userParams,
    userParamsData: userParams,
    userParamsKeys: userParams ? Object.keys(userParams) : []
  });
  
  if (!userParams) {
    console.warn('[DATA-EXTRACTOR] No userParams found in API response');
    return null;
  }
  
  // Extract data from userParams (most accurate source)
  const extractedData = {
    make: userParams.make || '',
    model: userParams.model || '',
    year: Number(userParams.year) || 0,
    transmission: userParams.gearbox || 'manual',
    vin: rawData.vin || '',
    mileage: Number(userParams.odometer) || 0
  };

  console.log('[DATA-EXTRACTOR] Extracted vehicle data:', extractedData);
  
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
