
/**
 * Changes made:
 * - 2025-04-18: Added sanitizePartialData function to handle partial valuation data
 * - 2025-04-19: Fixed TypeScript typing in sanitizePartialData function
 */

import { ValuationData } from "./valuationDataTypes";
import { calculateReservePrice } from "./valuationCalculator";

/**
 * Sanitize partial valuation data, removing any undefined or null values
 */
export function sanitizePartialData(data: Partial<ValuationData>): Partial<ValuationData> {
  // Create a new object with only defined values
  const sanitized: Partial<ValuationData> = {};

  // List of keys to check and potentially include
  const validKeys: (keyof ValuationData)[] = [
    'make', 'model', 'year', 'vin', 
    'transmission', 'mileage', 
    'valuation', 'reservePrice', 
    'averagePrice', 'basePrice'
  ];

  // Type-safe way to copy properties
  validKeys.forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      // Use type assertion to tell TypeScript this assignment is valid
      (sanitized as any)[key] = data[key];
    }
  });

  // Log the sanitization process for debugging
  console.log('Sanitizing partial valuation data:', {
    inputData: Object.keys(data),
    sanitizedData: Object.keys(sanitized)
  });

  return sanitized;
}

// Existing code for normalizeValuationData remains the same
/**
 * Normalize valuation data from various sources into a consistent format
 */
export function normalizeValuationData(data: any): ValuationData {
  // Log incoming data for debugging
  console.log('Normalizing valuation data:', {
    dataKeys: data ? Object.keys(data) : [],
    hasMake: !!data?.make,
    hasModel: !!data?.model,
    hasYear: !!data?.year,
    hasValuation: !!(data?.valuation || data?.reservePrice),
    hasAveragePrice: !!data?.averagePrice,
    hasBasePrice: !!data?.basePrice,
    priceFields: extractPriceRelatedFields(data)
  });
  
  // Extract the pricing information using multiple fallback options
  const priceInfo = extractPriceInfo(data);
  
  // Log extracted price info
  console.log('Extracted price info:', priceInfo);

  return {
    make: data?.make || '',
    model: data?.model || '',
    year: data?.year || data?.productionYear || 0,
    vin: data?.vin || '',
    transmission: data?.transmission || 'manual',
    mileage: data?.mileage || 0,
    valuation: priceInfo.valuation,
    reservePrice: priceInfo.reservePrice,
    averagePrice: priceInfo.averagePrice,
    basePrice: priceInfo.basePrice,
    apiSource: data?.apiSource || 'default',
    error: data?.error,
    noData: data?.noData,
    isExisting: data?.isExisting
  };
}

/**
 * Extract all price-related fields from an object for debugging
 */
function extractPriceRelatedFields(data: any): Record<string, number> {
  if (!data || typeof data !== 'object') return {};
  
  const priceFields: Record<string, number> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (
      (key.toLowerCase().includes('price') || 
       key.toLowerCase().includes('value') ||
       key.toLowerCase().includes('valuation')) && 
      typeof value === 'number'
    ) {
      priceFields[key] = value;
    }
  }
  
  // Also check nested properties like valuationDetails
  const nestedObjects = ['valuationDetails', 'data', 'apiData'];
  for (const nestedKey of nestedObjects) {
    if (data[nestedKey] && typeof data[nestedKey] === 'object') {
      for (const [key, value] of Object.entries(data[nestedKey])) {
        if (
          (key.toLowerCase().includes('price') || 
           key.toLowerCase().includes('value') ||
           key.toLowerCase().includes('valuation')) && 
          typeof value === 'number'
        ) {
          priceFields[`${nestedKey}.${key}`] = value as number;
        }
      }
    }
  }
  
  return priceFields;
}

/**
 * Extract and calculate price information from API response
 */
function extractPriceInfo(data: any): {
  basePrice: number;
  reservePrice: number;
  valuation: number;
  averagePrice: number;
} {
  // Initialize with defaults
  let basePrice = 0;
  let reservePrice = 0;
  let valuation = 0;
  let averagePrice = 0;
  
  // First, check for direct values that we want to use
  if (data.reservePrice && typeof data.reservePrice === 'number' && data.reservePrice > 0) {
    reservePrice = data.reservePrice;
  }
  
  if (data.valuation && typeof data.valuation === 'number' && data.valuation > 0) {
    valuation = data.valuation;
  }
  
  if (data.basePrice && typeof data.basePrice === 'number' && data.basePrice > 0) {
    basePrice = data.basePrice;
  }
  
  if (data.averagePrice && typeof data.averagePrice === 'number' && data.averagePrice > 0) {
    averagePrice = data.averagePrice;
  }
  
  // Special handling for Auto ISO API format
  if (data.price_min !== undefined && data.price_med !== undefined) {
    const min = Number(data.price_min);
    const med = Number(data.price_med);
    
    if (min > 0 && med > 0) {
      // This is the API standard calculation
      basePrice = (min + med) / 2;
      console.log('Using Auto ISO format - calculated base price:', basePrice);
    }
  }
  
  // If we have a basePrice but no reservePrice, calculate it
  if (basePrice > 0 && reservePrice <= 0) {
    reservePrice = calculateReservePrice(basePrice);
    console.log('Calculated reserve price from base price:', { basePrice, reservePrice });
  }
  
  // If we have a reservePrice but no basePrice, approximate it
  if (reservePrice > 0 && basePrice <= 0) {
    // Roughly estimate a basePrice from the reservePrice
    // This is an approximation and not as accurate as the official formula
    basePrice = reservePrice * 1.35; // Average markup based on our pricing tiers
    console.log('Estimated base price from reserve price:', { reservePrice, basePrice });
  }
  
  // Ensure we have values in both valuation and reservePrice for compatibility
  if (reservePrice > 0 && valuation <= 0) {
    valuation = reservePrice;
  } else if (valuation > 0 && reservePrice <= 0) {
    reservePrice = valuation;
  }
  
  // If averagePrice is missing, use basePrice
  if (averagePrice <= 0 && basePrice > 0) {
    averagePrice = basePrice;
  }
  
  // If we have vehicle details but absolutely no price data, provide a fallback
  // This should only happen in development/testing
  if (basePrice <= 0 && reservePrice <= 0 && valuation <= 0 && data.make && data.model) {
    console.warn('No price data available for vehicle with details. Using fallback values.');
    basePrice = 35000; // Fallback value 
    reservePrice = calculateReservePrice(basePrice);
    valuation = reservePrice;
    averagePrice = basePrice;
  }
  
  return {
    basePrice,
    reservePrice,
    valuation,
    averagePrice
  };
}
