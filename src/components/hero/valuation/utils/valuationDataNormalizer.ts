/**
 * Created: 2028-06-14
 * Modified: 2024-08-06
 * Modified: 2025-04-17 - Improved data normalization and validation for the external API response
 * Modified: 2025-04-17 - Fixed extraction of vehicle data from external API responses
 * Utility functions to normalize and validate valuation data
 */

import { ValuationData, TransmissionType } from "../types";
import { extractPrice, calculateReservePrice } from "@/utils/priceExtractor";

/**
 * Normalizes valuation data ensuring consistent property names and values
 */
export function normalizeValuationData(data: any): ValuationData {
  // If data is falsy, return an empty object with proper typing
  if (!data) {
    console.warn('Normalizing empty valuation data');
    return {} as ValuationData;
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
    rawData: JSON.stringify(data).substring(0, 500)
  });
  
  // Check multiple possible locations for our vehicle data
  const nestedData = data.data || data.apiResponse || data.valuationDetails || data.apiData || {};
  const searchData = data.search_data || nestedData.search_data || {};
  
  // External API specific response formats - check inside these first
  const externalApiData = searchData || nestedData || {};
  
  // Try to extract make from various possible locations with specific API formats
  const make = 
    data.make || 
    nestedData.make || 
    externalApiData.make ||
    data.manufacturer || 
    nestedData.manufacturer || 
    externalApiData.manufacturer ||
    data.brand || 
    nestedData.brand ||
    externalApiData.brand ||
    findNestedProperty(data, 'make') ||
    findNestedProperty(data, 'manufacturer') ||
    findNestedProperty(data, 'brand') ||
    '';
  
  // Try to extract model from various possible locations
  const model = 
    data.model || 
    nestedData.model || 
    externalApiData.model ||
    data.modelName || 
    nestedData.modelName || 
    externalApiData.modelName ||
    findNestedProperty(data, 'model') ||
    findNestedProperty(data, 'modelName') ||
    '';
  
  // Try to extract year from various possible locations
  const year = 
    data.year || 
    nestedData.year || 
    externalApiData.year ||
    data.productionYear || 
    nestedData.productionYear ||
    externalApiData.productionYear ||
    findNestedProperty(data, 'year') ||
    findNestedProperty(data, 'productionYear') ||
    0;
  
  // Extract valuation data - this is critical for showing the correct prices
  const extractedPrice = extractPrice(data) || 0;
  const basePrice = extractedPrice || data.price_med || data.valuation || nestedData.price_med || 0;
  const reservePrice = data.reservePrice || nestedData.reservePrice || 
                       (basePrice ? calculateReservePrice(basePrice) : 0);
  
  console.log('Extracted price information:', {
    extractedPrice,
    basePrice,
    reservePrice,
    dataPrice: data.price,
    dataValuation: data.valuation,
    dataReservePrice: data.reservePrice,
    nestedDataPrice: nestedData.price,
    nestedDataValuation: nestedData.valuation
  });
  
  // Create a normalized valuation data object
  const normalized: ValuationData = {
    // Basic vehicle information with robust fallbacks
    make: make || '',
    model: model || '',
    year: year ? Number(year) : new Date().getFullYear(),
    vin: data.vin || '',
    mileage: data.mileage || 0,
    
    // Ensure the transmission type is valid or default to manual
    transmission: (data.transmission === 'manual' || data.transmission === 'automatic') 
      ? data.transmission as TransmissionType 
      : 'manual' as TransmissionType,
      
    // Handle valuation values with consistent property names and multiple fallbacks
    valuation: basePrice,
    reservePrice: reservePrice,
    
    // Handle average price with fallbacks
    averagePrice: data.averagePrice || data.basePrice || data.price_med || 
                 nestedData.averagePrice || nestedData.price_med || basePrice,
    
    // Other properties
    isExisting: !!data.isExisting,
    error: data.error || '',
    noData: !!data.noData
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
 * Validates if valuation data contains all required properties
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
 * Find a property in a nested object structure
 */
function findNestedProperty(obj: any, propertyName: string, maxDepth = 3, currentDepth = 0): any {
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
