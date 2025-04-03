/**
 * Created: 2028-06-14
 * Modified: 2024-08-06
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
  
  console.log('Normalizing valuation data:', {
    hasValuation: !!data.valuation,
    hasReservePrice: !!data.reservePrice,
    hasBasePrice: !!data.basePrice,
    hasAveragePrice: !!data.averagePrice
  });
  
  // Create a normalized valuation data object
  const normalized: ValuationData = {
    // Basic vehicle information
    make: data.make || '',
    model: data.model || '',
    year: data.year || new Date().getFullYear(),
    vin: data.vin || '',
    mileage: data.mileage || 0,
    
    // Ensure the transmission type is valid or default to manual
    transmission: (data.transmission === 'manual' || data.transmission === 'automatic') 
      ? data.transmission as TransmissionType 
      : 'manual' as TransmissionType,
      
    // Handle valuation values with consistent property names
    // Ensure both valuation and reservePrice properties exist with fallbacks
    valuation: data.valuation ?? data.reservePrice ?? data.price ?? data.basePrice ?? 0,
    reservePrice: data.reservePrice ?? data.valuation ?? data.price ?? data.basePrice ?? 0,
    
    // Handle average price with fallbacks
    averagePrice: data.averagePrice ?? data.basePrice ?? data.price_med ?? 0,
    
    // Other properties
    isExisting: !!data.isExisting,
    error: data.error || '',
    noData: !!data.noData
  };
  
  console.log('Normalized result:', normalized);
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
