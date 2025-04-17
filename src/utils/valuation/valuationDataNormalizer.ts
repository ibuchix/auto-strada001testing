
/**
 * Valuation Data Normalization Utilities
 * Created: 2025-04-17
 * 
 * This module provides standard utilities for normalizing valuation data
 * from various sources into a consistent format defined in valuationDataTypes.ts
 */

import { ValuationData, TransmissionType, calculateReservePrice } from "./valuationDataTypes";

/**
 * Normalizes valuation data ensuring consistent property names and values
 * @param data Raw data from any source
 * @returns Standardized ValuationData object
 */
export function normalizeValuationData(data: any): ValuationData {
  // If data is falsy, return an empty object with proper typing
  if (!data) {
    console.warn('Normalizing empty valuation data');
    return createEmptyValuationData();
  }
  
  console.log('Normalizing raw valuation data:', {
    dataKeys: Object.keys(data),
    hasDirectMake: !!data.make,
    hasDirectModel: !!data.model,
    hasDirectYear: !!data.year,
    hasDataObject: !!data.data,
    hasApiResponse: !!data.apiResponse,
    hasApiData: !!data.apiData,
    hasValuationDetails: !!data.valuationDetails,
    rawDataSample: JSON.stringify(data).substring(0, 200) + '...'
  });
  
  // Unpack nested data sources - check multiple possible locations
  const dataSource = extractDataSource(data);
  
  // Extract basic vehicle information with robust fallbacks
  const make = extractProperty(data, dataSource, ['make', 'manufacturer', 'brand'], '');
  const model = extractProperty(data, dataSource, ['model', 'modelName'], '');
  const year = Number(extractProperty(data, dataSource, ['year', 'productionYear'], new Date().getFullYear()));
  const vin = extractProperty(data, dataSource, ['vin'], '');
  const mileage = Number(extractProperty(data, dataSource, ['mileage', 'odometer'], 0));
  
  // Extract transmission with validation
  const rawTransmission = extractProperty(data, dataSource, ['transmission', 'gearbox'], 'manual');
  const transmission: TransmissionType = 
    (rawTransmission === 'manual' || rawTransmission === 'automatic') 
      ? rawTransmission as TransmissionType 
      : 'manual';
  
  // Extract valuation data with robust fallbacks
  const extractedPrice = extractPrice(data, dataSource);
  const basePrice = extractedPrice || 0;
  
  // Ensure we have a reserve price, calculating it if needed
  let reservePrice = extractProperty(data, dataSource, ['reservePrice'], null);
  
  if (reservePrice === null && basePrice > 0) {
    reservePrice = calculateReservePrice(basePrice);
    console.log('Calculated reserve price:', {
      basePrice,
      reservePrice
    });
  } else if (reservePrice === null) {
    reservePrice = 0;
  }
  
  // Extract average price with fallbacks
  const averagePrice = extractProperty(
    data, 
    dataSource, 
    ['averagePrice', 'basePrice', 'price_med'], 
    basePrice
  );
  
  // Create a normalized valuation data object
  const normalized: ValuationData = {
    make,
    model,
    year,
    vin,
    mileage,
    transmission,
    valuation: basePrice,
    reservePrice: Number(reservePrice),
    averagePrice: Number(averagePrice),
    isExisting: !!data.isExisting,
    error: data.error || '',
    noData: !!data.noData,
    
    // Include API source metadata if available
    apiSource: data.apiSource || dataSource.apiSource || 'unknown',
    valuationDate: data.valuationDate || new Date().toISOString()
  };
  
  console.log('Normalized valuation data:', {
    make: normalized.make,
    model: normalized.model,
    year: normalized.year,
    valuation: normalized.valuation,
    reservePrice: normalized.reservePrice,
    hasAllRequiredFields: !!(normalized.make && normalized.model && normalized.year)
  });
  
  return normalized;
}

/**
 * Extracts a property from various possible locations with fallbacks
 */
function extractProperty(data: any, dataSource: any, propertyNames: string[], defaultValue: any): any {
  // Try the property names directly on data
  for (const name of propertyNames) {
    if (data && data[name] !== undefined) {
      return data[name];
    }
  }
  
  // Try on data.data
  if (data && data.data) {
    for (const name of propertyNames) {
      if (data.data[name] !== undefined) {
        return data.data[name];
      }
    }
  }
  
  // Try on extracted dataSource
  if (dataSource) {
    for (const name of propertyNames) {
      if (dataSource[name] !== undefined) {
        return dataSource[name];
      }
    }
  }
  
  // Try deep search for the first property name
  if (propertyNames.length > 0) {
    const found = findNestedProperty(data, propertyNames[0]);
    if (found !== undefined) {
      return found;
    }
  }
  
  // Return default value if not found
  return defaultValue;
}

/**
 * Extracts price information with a multi-level search
 */
function extractPrice(data: any, dataSource: any): number {
  // Direct price properties
  const directPrice = extractProperty(
    data, 
    dataSource, 
    ['price', 'valuation', 'reservePrice', 'averagePrice', 'price_med', 'price_min'], 
    null
  );
  
  if (directPrice !== null) {
    return Number(directPrice);
  }
  
  // Calculate from min/med if available
  const priceMin = extractProperty(data, dataSource, ['price_min'], null);
  const priceMed = extractProperty(data, dataSource, ['price_med'], null);
  
  if (priceMin !== null && priceMed !== null) {
    return (Number(priceMin) + Number(priceMed)) / 2;
  }
  
  // Deep search for any price-related field
  const nestedPrice = findNestedProperty(data, 'price') || 
                      findNestedProperty(data, 'valuation') || 
                      findNestedProperty(data, 'price_med');
                      
  if (nestedPrice !== undefined) {
    return Number(nestedPrice);
  }
  
  return 0;
}

/**
 * Find a property in a nested object structure with depth limitation
 */
function findNestedProperty(obj: any, propertyName: string, maxDepth = 4, currentDepth = 0): any {
  // Base case: max depth reached or object is null/undefined
  if (currentDepth > maxDepth || !obj || typeof obj !== 'object') {
    return undefined;
  }
  
  // Check direct property access
  if (obj[propertyName] !== undefined) {
    return obj[propertyName];
  }
  
  // Check each property for nested objects
  for (const key in obj) {
    // Skip checking properties that are clearly not objects or arrays
    if (obj[key] === null || typeof obj[key] !== 'object') continue;
    
    // Skip checking functions and DOM elements
    if (typeof obj[key] === 'function' || (obj[key] instanceof Element)) continue;
    
    try {
      const result = findNestedProperty(obj[key], propertyName, maxDepth, currentDepth + 1);
      if (result !== undefined) {
        return result;
      }
    } catch (e) {
      // Skip errors from circular references or other issues
      continue;
    }
  }
  
  return undefined;
}

/**
 * Extracts the main data source from potentially nested API responses
 */
function extractDataSource(data: any): any {
  if (!data) return {};
  
  // Check data.data (common API response pattern)
  if (data.data && typeof data.data === 'object') {
    return {
      ...data.data,
      apiSource: 'data.data'
    };
  }
  
  // Check data.apiResponse (our custom wrapper pattern)
  if (data.apiResponse && typeof data.apiResponse === 'object') {
    return {
      ...data.apiResponse,
      apiSource: 'apiResponse'
    };
  }
  
  // Check data.valuationDetails (our custom structure)
  if (data.valuationDetails && typeof data.valuationDetails === 'object') {
    return {
      ...data.valuationDetails,
      apiSource: 'valuationDetails'
    };
  }
  
  // Check data.apiData (another common pattern)
  if (data.apiData && typeof data.apiData === 'object') {
    return {
      ...data.apiData,
      apiSource: 'apiData'
    };
  }
  
  // Check for search_data at various levels
  if (data.search_data && typeof data.search_data === 'object') {
    return {
      ...data.search_data,
      apiSource: 'search_data'
    };
  }
  
  if (data.data?.search_data && typeof data.data.search_data === 'object') {
    return {
      ...data.data.search_data,
      apiSource: 'data.search_data'
    };
  }
  
  // Default to the original data
  return {
    ...data,
    apiSource: 'original'
  };
}

/**
 * Creates an empty valuation data object with default values
 */
function createEmptyValuationData(): ValuationData {
  return {
    make: '',
    model: '',
    year: 0,
    vin: '',
    mileage: 0,
    transmission: 'manual',
    valuation: 0,
    reservePrice: 0,
    noData: true
  };
}

/**
 * Validates if a valuation data object has all required fields
 */
export function validateValuationData(data: any): boolean {
  if (!data) return false;
  
  // Check if we have all the basic required vehicle data
  const hasBasicData = Boolean(
    data.make && 
    data.model && 
    data.year
  );
  
  // Check if we have either valuation or reservePrice
  const hasPriceData = Boolean(
    ((data.reservePrice !== undefined) && Number(data.reservePrice) >= 0) || 
    ((data.valuation !== undefined) && Number(data.valuation) >= 0)
  );
  
  const isValid = hasBasicData && hasPriceData;
  
  console.log('Validation result for valuation data:', {
    isValid,
    hasBasicData,
    hasPriceData,
    make: data.make,
    model: data.model,
    year: data.year,
    reservePrice: data.reservePrice,
    valuation: data.valuation
  });
  
  return isValid;
}

/**
 * Ensure partial data has consistent types
 */
export function sanitizePartialData(data: Partial<ValuationData>): Partial<ValuationData> {
  if (!data) return {};
  
  return {
    ...data,
    year: data.year ? Number(data.year) : undefined,
    mileage: data.mileage ? Number(data.mileage) : undefined,
    valuation: data.valuation ? Number(data.valuation) : undefined,
    reservePrice: data.reservePrice ? Number(data.reservePrice) : undefined,
    averagePrice: data.averagePrice ? Number(data.averagePrice) : undefined
  };
}
