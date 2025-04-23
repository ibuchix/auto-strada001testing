
/**
 * Vehicle data extraction utility
 * Created: 2025-04-23
 * Updated: 2025-04-23 - Enhanced nested data extraction with better debugging
 * Updated: 2025-04-24 - Fixed deep path traversal for complex API responses
 * Updated: 2025-04-25 - Fixed duplicate property names in debug logging
 * Updated: 2025-04-26 - Enhanced extraction with additional paths for year and mileage
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
    hasNestedData: !!rawData?.data
  });
  
  // ENHANCED: Try multiple paths for reliable data extraction
  
  // Extract data from userParams if present (highest priority)
  const userParams = rawData?.functionResponse?.userParams || 
                    rawData?.data?.functionResponse?.userParams;
  
  // Determine data source priority
  let dataSource = rawData;
  if (rawData?.data && typeof rawData.data === 'object') {
    if (Object.keys(rawData.data).length > 0) {
      console.log('[DATA-EXTRACTOR] Using nested data property as primary source');
      dataSource = rawData.data;
    }
  }
  
  console.log('[DATA-EXTRACTOR] User params found:', {
    hasUserParams: !!userParams,
    userParamsKeys: userParams ? Object.keys(userParams) : [],
    primaryDataSource: dataSource === rawData ? 'root' : 'nested data'
  });
  
  // Extract vehicle information with multi-path fallbacks
  const make = extractVehicleField('make', userParams, dataSource, rawData);
  const model = extractVehicleField('model', userParams, dataSource, rawData);
  const year = extractNumberField('year', userParams, dataSource, rawData);
  const vin = extractVehicleField('vin', userParams, dataSource, rawData);
  const mileage = extractNumberField('mileage', userParams, dataSource, rawData, 'odometer');
  const transmission = extractVehicleField('transmission', userParams, dataSource, rawData, 'gearbox');
  
  const extractedData = {
    make,
    model,
    year,
    transmission: transmission || 'manual',
    vin,
    mileage
  };

  console.log('[DATA-EXTRACTOR] Extracted vehicle data:', extractedData);
  
  return extractedData;
}

/**
 * Extract string field from various possible locations
 */
function extractVehicleField(
  fieldName: string,
  userParams: any,
  dataSource: any,
  rawData: any,
  alternateFieldName?: string
): string {
  // Check in user params first (most accurate)
  if (userParams && userParams[fieldName]) {
    console.log(`[DATA-EXTRACTOR] Found ${fieldName} in userParams:`, userParams[fieldName]);
    return userParams[fieldName];
  }
  
  if (alternateFieldName && userParams && userParams[alternateFieldName]) {
    console.log(`[DATA-EXTRACTOR] Found ${fieldName} as ${alternateFieldName} in userParams:`, userParams[alternateFieldName]);
    return userParams[alternateFieldName];
  }
  
  // Check in data source (nested data or root)
  if (dataSource && dataSource[fieldName]) {
    console.log(`[DATA-EXTRACTOR] Found ${fieldName} in data source:`, dataSource[fieldName]);
    return dataSource[fieldName];
  }
  
  if (alternateFieldName && dataSource && dataSource[alternateFieldName]) {
    console.log(`[DATA-EXTRACTOR] Found ${fieldName} as ${alternateFieldName} in data source:`, dataSource[alternateFieldName]);
    return dataSource[alternateFieldName];
  }
  
  // Check in raw data as last resort
  if (rawData[fieldName]) {
    console.log(`[DATA-EXTRACTOR] Found ${fieldName} in raw data:`, rawData[fieldName]);
    return rawData[fieldName];
  }
  
  if (alternateFieldName && rawData[alternateFieldName]) {
    console.log(`[DATA-EXTRACTOR] Found ${fieldName} as ${alternateFieldName} in raw data:`, rawData[alternateFieldName]);
    return rawData[alternateFieldName];
  }
  
  console.warn(`[DATA-EXTRACTOR] Could not find ${fieldName} in any location`);
  return '';
}

/**
 * Extract number field from various possible locations
 */
function extractNumberField(
  fieldName: string,
  userParams: any,
  dataSource: any,
  rawData: any,
  alternateFieldName?: string
): number {
  // Check in user params first (most accurate)
  if (userParams && userParams[fieldName] !== undefined) {
    const value = Number(userParams[fieldName]);
    if (!isNaN(value)) {
      console.log(`[DATA-EXTRACTOR] Found ${fieldName} in userParams:`, value);
      return value;
    }
  }
  
  if (alternateFieldName && userParams && userParams[alternateFieldName] !== undefined) {
    const value = Number(userParams[alternateFieldName]);
    if (!isNaN(value)) {
      console.log(`[DATA-EXTRACTOR] Found ${fieldName} as ${alternateFieldName} in userParams:`, value);
      return value;
    }
  }
  
  // Check in data source (nested data or root)
  if (dataSource && dataSource[fieldName] !== undefined) {
    const value = Number(dataSource[fieldName]);
    if (!isNaN(value)) {
      console.log(`[DATA-EXTRACTOR] Found ${fieldName} in data source:`, value);
      return value;
    }
  }
  
  if (alternateFieldName && dataSource && dataSource[alternateFieldName] !== undefined) {
    const value = Number(dataSource[alternateFieldName]);
    if (!isNaN(value)) {
      console.log(`[DATA-EXTRACTOR] Found ${fieldName} as ${alternateFieldName} in data source:`, value);
      return value;
    }
  }
  
  // Check in raw data as last resort
  if (rawData[fieldName] !== undefined) {
    const value = Number(rawData[fieldName]);
    if (!isNaN(value)) {
      console.log(`[DATA-EXTRACTOR] Found ${fieldName} in raw data:`, value);
      return value;
    }
  }
  
  if (alternateFieldName && rawData[alternateFieldName] !== undefined) {
    const value = Number(rawData[alternateFieldName]);
    if (!isNaN(value)) {
      console.log(`[DATA-EXTRACTOR] Found ${fieldName} as ${alternateFieldName} in raw data:`, value);
      return value;
    }
  }
  
  console.warn(`[DATA-EXTRACTOR] Could not find ${fieldName} in any location`);
  return 0;
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
