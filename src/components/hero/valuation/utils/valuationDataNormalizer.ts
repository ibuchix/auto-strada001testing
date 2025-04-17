/**
 * Created: 2028-06-14
 * Modified: 2024-08-06
 * Modified: 2025-04-17 - Improved data normalization and validation for the external API response
 * Utility functions to normalize and validate valuation data
 */

import { ValuationData, TransmissionType } from "../types";

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
    hasValuationDetails: !!data.valuationDetails
  });
  
  // Check nested data structures that might contain our vehicle information
  const nestedData = data.data || data.apiResponse || data.valuationDetails || {};
  
  // Try to extract make from various possible locations
  const make = 
    data.make || 
    nestedData.make || 
    data.manufacturer || 
    nestedData.manufacturer || 
    data.brand || 
    nestedData.brand || 
    '';
  
  // Try to extract model from various possible locations
  const model = 
    data.model || 
    nestedData.model || 
    data.modelName || 
    nestedData.modelName || 
    '';
  
  // Try to extract year from various possible locations
  const year = 
    data.year || 
    nestedData.year || 
    data.productionYear || 
    nestedData.productionYear || 
    0;
  
  // Create a normalized valuation data object
  const normalized: ValuationData = {
    // Basic vehicle information with robust fallbacks
    make: make || '',
    model: model || '',
    year: year || new Date().getFullYear(),
    vin: data.vin || '',
    mileage: data.mileage || 0,
    
    // Ensure the transmission type is valid or default to manual
    transmission: (data.transmission === 'manual' || data.transmission === 'automatic') 
      ? data.transmission as TransmissionType 
      : 'manual' as TransmissionType,
      
    // Handle valuation values with consistent property names and multiple fallbacks
    valuation: data.valuation ?? data.reservePrice ?? data.price ?? data.basePrice ?? 
               nestedData.valuation ?? nestedData.price ?? 0,
               
    reservePrice: data.reservePrice ?? data.valuation ?? data.price ?? data.basePrice ?? 
                 nestedData.reservePrice ?? nestedData.price ?? 0,
    
    // Handle average price with fallbacks
    averagePrice: data.averagePrice ?? data.basePrice ?? data.price_med ?? 
                 nestedData.averagePrice ?? nestedData.price_med ?? 0,
    
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
