
/**
 * Changes made:
 * - 2025-04-21: Created utility for extracting data from API response
 * - 2025-04-21: Updated RawValuationData interface to include vin at all levels
 * - 2025-04-21: Enhanced price data extraction to handle nested API response
 * - 2025-04-21: Added basePrice to RawValuationData interface to fix TypeScript errors
 * - 2025-04-21: Enhanced price calculation to better handle fallback cases
 * - 2025-04-22: Fixed extraction of nested pricing data from functionResponse structure
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
  // Try to get data from nested structure first, then fallback to root
  const sourceData = rawData?.data || rawData;
  
  // First check for price data in functionResponse.valuation.calcValuation
  const calcValuation = rawData?.functionResponse?.valuation?.calcValuation;
  
  // Log all possible price data sources for debugging
  console.log('[DATA-EXTRACTOR] Available price fields:', {
    fromSource: Object.keys(sourceData).filter(key => 
      ['price', 'valuation', 'reservePrice', 'averagePrice', 'price_min', 'price_med', 'basePrice'].includes(key)
    ),
    fromCalcValuation: calcValuation ? Object.keys(calcValuation) : [],
    calcValuationPriceMin: calcValuation?.price_min,
    calcValuationPriceMed: calcValuation?.price_med,
    sourcePriceMin: sourceData.price_min,
    sourcePriceMed: sourceData.price_med,
    values: {
      price: sourceData.price,
      valuation: sourceData.valuation,
      reservePrice: sourceData.reservePrice,
      averagePrice: sourceData.averagePrice,
      price_min: sourceData.price_min,
      price_med: sourceData.price_med,
      basePrice: sourceData.basePrice
    }
  });

  // Calculate base price with priority order:
  // 1. Use calcValuation.price_min/price_med if available (most reliable)
  // 2. Then try sourceData.price_min/price_med
  // 3. Then try other price fields or provided basePrice
  let basePrice = 0;
  let calculatedFromMinMed = false;
  let priceSource = 'unknown';
  
  // 1. First priority: Check calcValuation (the most reliable source)
  if (calcValuation && calcValuation.price_min && calcValuation.price_med) {
    basePrice = (Number(calcValuation.price_min) + Number(calcValuation.price_med)) / 2;
    calculatedFromMinMed = true;
    priceSource = 'calcValuation';
    
    console.log('[DATA-EXTRACTOR] Calculated base price from calcValuation min/med:', {
      price_min: calcValuation.price_min,
      price_med: calcValuation.price_med,
      basePrice
    });
  }
  // 2. Second priority: Try data.price_min/price_med
  else if (sourceData.price_min && sourceData.price_med) {
    basePrice = (Number(sourceData.price_min) + Number(sourceData.price_med)) / 2;
    calculatedFromMinMed = true;
    priceSource = 'sourceData';
    
    console.log('[DATA-EXTRACTOR] Calculated base price from source min/med:', {
      price_min: sourceData.price_min,
      price_med: sourceData.price_med,
      basePrice
    });
  }
  // 3. Third priority: Check if basePrice is directly provided
  else if (sourceData.basePrice && sourceData.basePrice > 0) {
    basePrice = sourceData.basePrice;
    priceSource = 'providedBasePrice';
    console.log('[DATA-EXTRACTOR] Using provided base price:', basePrice);
  }
  // 4. Fourth priority: Try alternative price fields
  else {
    // Try other price fields
    basePrice = sourceData.basePrice || 
                sourceData.valuation || 
                sourceData.price || 
                sourceData.averagePrice || 
                calcValuation?.price ||
                calcValuation?.price_avr ||
                0;
                
    if (basePrice > 0) {
      priceSource = basePrice === sourceData.valuation ? 'valuation' : 
                   basePrice === sourceData.price ? 'price' : 
                   basePrice === sourceData.averagePrice ? 'averagePrice' :
                   basePrice === calcValuation?.price ? 'calcValuation.price' :
                   basePrice === calcValuation?.price_avr ? 'calcValuation.price_avr' :
                   'unknown';
      
      console.log('[DATA-EXTRACTOR] Using alternative price field:', {
        source: priceSource,
        value: basePrice
      });
    }
  }
  
  // Use root-level prices if they exist and we didn't already calculate from min/med
  if (!calculatedFromMinMed && basePrice === 0) {
    if (rawData.basePrice && rawData.basePrice > 0) {
      basePrice = rawData.basePrice;
      priceSource = 'rootBasePrice';
      console.log('[DATA-EXTRACTOR] Using root level basePrice:', basePrice);
    } else if (rawData.price_min && rawData.price_med) {
      basePrice = (Number(rawData.price_min) + Number(rawData.price_med)) / 2;
      priceSource = 'rootMinMed';
      console.log('[DATA-EXTRACTOR] Calculated base price from root min/med:', {
        price_min: rawData.price_min,
        price_med: rawData.price_med,
        basePrice
      });
    }
  }
  
  // Get the average price from the most reliable source
  let averagePrice = calcValuation?.price_med || 
                    calcValuation?.price_avr || 
                    sourceData.averagePrice || 
                    sourceData.price_med || 
                    basePrice;

  console.log('[DATA-EXTRACTOR] Final extracted prices:', {
    basePrice,
    averagePrice,
    priceSource,
    usingFallbackEstimation: basePrice === 0
  });
  
  // Now return all available price data
  return {
    price: sourceData.price || calcValuation?.price || 0,
    valuation: sourceData.valuation || basePrice,
    reservePrice: sourceData.reservePrice || 0,
    averagePrice: averagePrice,
    basePrice: basePrice
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
