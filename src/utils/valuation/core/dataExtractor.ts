
/**
 * Changes made:
 * - 2025-04-21: Created utility for extracting data from API response
 * - 2025-04-21: Updated RawValuationData interface to include vin at all levels
 * - 2025-04-21: Enhanced price data extraction to handle nested API response
 * - 2025-04-21: Added basePrice to RawValuationData interface to fix TypeScript errors
 * - 2025-04-21: Enhanced price calculation to better handle fallback cases
 * - 2025-04-22: Fixed extraction of nested pricing data from functionResponse structure
 * - 2025-04-26: Completely refactored price extraction to prioritize functionResponse structure
 * - 2025-04-29: Added CRITICAL DEBUGGING for nested API response structure extraction
 */

import { ValuationData } from '../valuationDataTypes';

export interface RawValuationData {
  success?: boolean;
  data?: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    mileage?: number;
    price?: number;
    valuation?: number;
    reservePrice?: number;
    averagePrice?: number;
    price_min?: number;
    price_med?: number;
    basePrice?: number;
  };
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  transmission?: string;
  mileage?: number;
  price?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  price_min?: number;
  price_med?: number;
  basePrice?: number;
  // Add the nested structure from the API
  functionResponse?: {
    userParams?: {
      make?: string;
      model?: string;
      year?: number;
    };
    valuation?: {
      calcValuation?: {
        price?: number;
        price_min?: number;
        price_med?: number;
        price_max?: number;
        price_avr?: number;
      }
    }
  };
}

export function extractVehicleData(rawData: RawValuationData) {
  // Try to get data from nested structure first, then fallback to root
  const sourceData = rawData?.data || rawData;
  
  // For make, model, year - first check functionResponse if available
  const make = rawData?.functionResponse?.userParams?.make || 
               sourceData.make || 
               '';
               
  const model = rawData?.functionResponse?.userParams?.model || 
                sourceData.model || 
                '';
                
  const year = rawData?.functionResponse?.userParams?.year || 
               sourceData.year || 
               0;
  
  console.log('[DATA-EXTRACTOR] Using data source:', {
    isNested: !!rawData?.data,
    hasFunctionResponse: !!rawData?.functionResponse,
    dataKeys: Object.keys(sourceData),
    extractedMake: make,
    extractedModel: model,
    extractedYear: year
  });
  
  return {
    make: make,
    model: model,
    year: year,
    vin: sourceData.vin || '',
    mileage: sourceData.mileage || 0,
    transmission: rawData.transmission || 'manual'
  };
}

export function extractPriceData(rawData: RawValuationData) {
  // RAW DATA DEBUG LOG - Print the entire object structure
  console.log('%c🔎 FULL RAW DATA STRUCTURE:', 'background: #333; color: #ff9; font-size: 14px; padding: 5px;', JSON.stringify(rawData, null, 2));

  // Enhanced logging for debugging
  console.log('%c🔍 DETAILED DATA EXTRACTION START', 'background: #2196F3; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    hasRawData: !!rawData,
    rawDataKeys: rawData ? Object.keys(rawData) : [],
    hasFunctionResponse: !!rawData?.functionResponse,
    hasValuation: !!rawData?.functionResponse?.valuation,
    nestedStructurePath: rawData?.functionResponse?.valuation?.calcValuation ? 'FOUND' : 'NOT FOUND'
  });

  // Check if we even have a functionResponse object
  if (!rawData?.functionResponse) {
    console.error('%c❌ MISSING FUNCTION RESPONSE', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
      rawDataTopLevel: Object.keys(rawData || {})
    });
  } else {
    // Log the entire functionResponse structure
    console.log('%c📊 FULL FUNCTION RESPONSE', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', 
      JSON.stringify(rawData.functionResponse, null, 2)
    );
    
    // Check for the valuation property
    if (!rawData.functionResponse.valuation) {
      console.error('%c❌ MISSING VALUATION PROPERTY', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        functionResponseKeys: Object.keys(rawData.functionResponse)
      });
    } else {
      // Log the valuation object
      console.log('%c📊 VALUATION OBJECT', 'background: #9C27B0; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', 
        JSON.stringify(rawData.functionResponse.valuation, null, 2)
      );
      
      // Check for calcValuation property
      if (!rawData.functionResponse.valuation.calcValuation) {
        console.error('%c❌ MISSING CALCVALUATION PROPERTY', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
          valuationKeys: Object.keys(rawData.functionResponse.valuation)
        });
      }
    }
  }

  // First, check if we have the functionResponse structure with calcValuation
  const calcValuation = rawData?.functionResponse?.valuation?.calcValuation;
  
  // Detailed logging of calcValuation
  console.log('%c💰 CALC VALUATION DETAILS', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    hasCalcValuation: !!calcValuation,
    priceMin: calcValuation?.price_min,
    priceMed: calcValuation?.price_med,
    price: calcValuation?.price,
    priceAvr: calcValuation?.price_avr,
    priceMax: calcValuation?.price_max
  });

  // PRIORITY 1: Try to get data from functionResponse.valuation.calcValuation first
  if (calcValuation && calcValuation.price_min !== undefined && calcValuation.price_med !== undefined) {
    const priceMin = Number(calcValuation.price_min);
    const priceMed = Number(calcValuation.price_med);
    
    // Extensive logging for price calculation
    console.log('%c✅ PRICE EXTRACTION SUCCESS', 'background: #8BC34A; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
      priceMin,
      priceMed,
      isValidPriceMin: !isNaN(priceMin) && priceMin > 0,
      isValidPriceMed: !isNaN(priceMed) && priceMed > 0
    });
    
    // Check if these are valid numbers and not zero
    if (!isNaN(priceMin) && !isNaN(priceMed) && priceMin > 0 && priceMed > 0) {
      // Calculate base price (average of min and median)
      const basePrice = (priceMin + priceMed) / 2;
      
      console.log('%c💸 BASE PRICE CALCULATION', 'background: #673AB7; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        priceMin,
        priceMed,
        calculatedBasePrice: basePrice,
        averagePrice: calcValuation.price_avr || basePrice,
        maxPrice: calcValuation.price_max
      });
      
      return {
        price: calcValuation.price || basePrice,
        valuation: basePrice,
        reservePrice: 0, // Will be calculated later
        averagePrice: priceMed,
        basePrice: basePrice
      };
    }
  }
  
  // PRIORITY 2: Try to get data from the nested data structure if available
  const sourceData = rawData?.data || rawData;
  
  if (sourceData.price_min !== undefined && sourceData.price_med !== undefined) {
    const priceMin = Number(sourceData.price_min);
    const priceMed = Number(sourceData.price_med);
    
    if (!isNaN(priceMin) && !isNaN(priceMed) && priceMin > 0 && priceMed > 0) {
      const basePrice = (priceMin + priceMed) / 2;
      
      console.log('[DATA-EXTRACTOR] Using price_min/price_med from source data:', {
        priceMin,
        priceMed,
        calculatedBasePrice: basePrice
      });
      
      return {
        price: sourceData.price || basePrice,
        valuation: basePrice,
        reservePrice: sourceData.reservePrice || 0,
        averagePrice: priceMed,
        basePrice: basePrice
      };
    }
  }
  
  // PRIORITY 3: Check if basePrice is directly provided
  if (sourceData.basePrice && sourceData.basePrice > 0) {
    console.log('[DATA-EXTRACTOR] Using provided base price:', sourceData.basePrice);
    
    return {
      price: sourceData.price || sourceData.basePrice,
      valuation: sourceData.valuation || sourceData.basePrice,
      reservePrice: sourceData.reservePrice || 0,
      averagePrice: sourceData.averagePrice || sourceData.basePrice,
      basePrice: sourceData.basePrice
    };
  }
  
  // PRIORITY 4: Try other price fields
  const possiblePriceField = sourceData.valuation || 
                            sourceData.price || 
                            sourceData.averagePrice || 
                            (calcValuation?.price || 0);
  
  if (possiblePriceField > 0) {
    console.log('[DATA-EXTRACTOR] Using alternative price field:', {
      value: possiblePriceField,
      source: sourceData.valuation ? 'valuation' : 
             sourceData.price ? 'price' : 
             sourceData.averagePrice ? 'averagePrice' :
             'calcValuation.price'
    });
    
    return {
      price: possiblePriceField,
      valuation: possiblePriceField,
      reservePrice: sourceData.reservePrice || 0,
      averagePrice: sourceData.averagePrice || possiblePriceField,
      basePrice: possiblePriceField
    };
  }
  
  // Fallback logging if no valid price data is found
  console.error('%c❌ NO VALID PRICE DATA FOUND', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    rawData: JSON.stringify(rawData, null, 2)
  });
  
  // If we get here, we couldn't find any valid price data
  console.warn('[DATA-EXTRACTOR] No valid price data found in the API response');
  
  return {
    price: 0,
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
}

// Add the sanitization utility that was previously in valuationDataNormalizer
export function sanitizePartialData(data: Partial<ValuationData>): Partial<ValuationData> {
  return {
    make: data.make?.trim() || undefined,
    model: data.model?.trim() || undefined,
    year: data.year || undefined,
    vin: data.vin?.trim() || undefined,
    transmission: data.transmission || undefined,
    mileage: data.mileage || undefined,
    valuation: data.valuation || undefined,
    reservePrice: data.reservePrice || undefined,
    averagePrice: data.averagePrice || undefined,
    basePrice: data.basePrice || undefined
  };
}
