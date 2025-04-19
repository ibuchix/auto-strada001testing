
/**
 * Changes made:
 * - 2025-04-19: Refactored price extraction to prioritize Auto ISO API format
 * - 2025-04-19: Improved logging and error handling for price calculations
 */

import { ValuationData } from "./valuationDataTypes";

export function normalizeValuationData(data: any): ValuationData {
  // Extract pricing information first
  const priceInfo = extractPriceInfo(data);
  
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

function extractPriceInfo(data: any): {
  basePrice: number;
  reservePrice: number;
  valuation: number;
  averagePrice: number;
} {
  // Log incoming data structure
  console.log('Extracting price info from data:', {
    hasAutoIsoFields: !!(data.price_min || data.price_med),
    price_min: data.price_min,
    price_med: data.price_med,
    directPrices: {
      basePrice: data.basePrice,
      valuation: data.valuation,
      reservePrice: data.reservePrice
    }
  });

  // Initialize price values
  let basePrice = 0;
  let reservePrice = 0;
  let valuation = 0;
  let averagePrice = 0;

  // PRIORITY 1: Auto ISO API Format (Our primary source)
  if (data.price_min !== undefined && data.price_med !== undefined) {
    const min = Number(data.price_min);
    const med = Number(data.price_med);
    
    if (min > 0 && med > 0) {
      basePrice = (min + med) / 2;
      console.log('AUTO ISO API: Calculated base price:', {
        price_min: min,
        price_med: med,
        basePrice
      });
      
      // Calculate reserve price using our tiered formula
      reservePrice = calculateReservePrice(basePrice);
      valuation = basePrice;
      averagePrice = med;
      
      return { basePrice, reservePrice, valuation, averagePrice };
    }
  }

  // PRIORITY 2: Direct API Values
  if (data.basePrice > 0 || data.valuation > 0) {
    basePrice = data.basePrice || data.valuation;
    reservePrice = data.reservePrice || calculateReservePrice(basePrice);
    valuation = data.valuation || basePrice;
    averagePrice = data.averagePrice || basePrice;
    
    console.log('Using direct API values:', {
      basePrice,
      reservePrice,
      valuation,
      averagePrice
    });
    
    return { basePrice, reservePrice, valuation, averagePrice };
  }

  // PRIORITY 3: Check primary nested locations
  const nestedData = data.data || data.apiResponse || data.valuationDetails;
  if (nestedData?.price_min && nestedData?.price_med) {
    const min = Number(nestedData.price_min);
    const med = Number(nestedData.price_med);
    
    if (min > 0 && med > 0) {
      basePrice = (min + med) / 2;
      reservePrice = calculateReservePrice(basePrice);
      valuation = basePrice;
      averagePrice = med;
      
      console.log('Using nested Auto ISO format:', {
        price_min: min,
        price_med: med,
        basePrice,
        reservePrice
      });
      
      return { basePrice, reservePrice, valuation, averagePrice };
    }
  }

  // No valid price data found
  console.error('No valid price data found in API response:', {
    dataKeys: Object.keys(data),
    vin: data.vin,
    make: data.make,
    model: data.model
  });

  return { basePrice: 0, reservePrice: 0, valuation: 0, averagePrice: 0 };
}

function calculateReservePrice(basePrice: number): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    console.error('Invalid base price for reserve calculation:', basePrice);
    return 0;
  }
  
  // Determine percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;
  
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  
  console.log('Reserve price calculation:', {
    basePrice,
    percentage: (percentage * 100).toFixed(1) + '%',
    reservePrice
  });
  
  return reservePrice;
}
