
/**
 * Data processing utilities for get-vehicle-valuation
 * Updated: 2025-04-25 - Enhanced price extraction with better API response handling
 */

import { logOperation } from './logging.ts';
import { calculateReservePrice } from './price-calculator.ts';
import { estimateBasePriceByModel } from './price-estimator.ts';

/**
 * Type definition for valuation data
 */
export interface ValuationData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  transmission?: string;
  basePrice?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  price_min?: number;
  price_med?: number;
  [key: string]: any;
}

/**
 * Extract data value with multiple property path support
 * @param data Source data object
 * @param propertyPaths Array of possible property paths to check
 * @param defaultValue Default value if not found
 * @returns Found value or default
 */
export function extractDataValue(data: any, propertyPaths: string[], defaultValue: any = null): any {
  // Try each property path in order
  for (const path of propertyPaths) {
    // Handle nested paths with dot notation
    const parts = path.split('.');
    let current = data;
    
    // Navigate through object following the path
    let valid = true;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        valid = false;
        break;
      }
      
      current = current[part];
      if (current === undefined) {
        valid = false;
        break;
      }
    }
    
    // If we successfully navigated the path and found a value
    if (valid && current !== undefined && current !== null) {
      // Convert to number if it looks numeric and we expect a number
      if (typeof current === 'string' && !isNaN(Number(current)) && 
          (typeof defaultValue === 'number' || defaultValue === 0)) {
        return Number(current);
      }
      return current;
    }
  }
  
  return defaultValue;
}

/**
 * Scan deeply for price data in API response
 */
function scanForPriceData(data: any, requestId: string): { priceMin: number, priceMed: number } {
  // Initialize with defaults
  let priceMin = 0;
  let priceMed = 0;
  
  // Start with direct paths at root level
  if (data.price_min !== undefined) priceMin = Number(data.price_min);
  if (data.price_med !== undefined) priceMed = Number(data.price_med);
  
  if (priceMin > 0 && priceMed > 0) {
    logOperation('found_price_data_at_root', {
      requestId,
      priceMin,
      priceMed
    });
    return { priceMin, priceMed };
  }
  
  // Look for nested CalcValuation (common in Auto ISO API)
  if (data.functionResponse?.valuation?.calcValuation) {
    const calcValuation = data.functionResponse.valuation.calcValuation;
    logOperation('found_nested_calcvaluation', {
      requestId,
      calcValuationKeys: Object.keys(calcValuation)
    });
    
    if (calcValuation.price_min !== undefined) priceMin = Number(calcValuation.price_min);
    if (calcValuation.price_med !== undefined) priceMed = Number(calcValuation.price_med);
    
    if (priceMin > 0 && priceMed > 0) {
      logOperation('found_price_data_in_calcvaluation', {
        requestId,
        priceMin,
        priceMed
      });
      return { priceMin, priceMed };
    }
  }
  
  // Try alternate field names
  const priceMinFields = ['priceMin', 'minPrice', 'minimum_value', 'price'];
  const priceMedFields = ['priceMed', 'medianPrice', 'median_value', 'average_value', 'price'];
  
  for (const field of priceMinFields) {
    if (data[field] !== undefined && priceMin === 0) {
      priceMin = Number(data[field]);
      logOperation('found_price_min_alternate', {
        requestId,
        field,
        value: priceMin
      });
    }
  }
  
  for (const field of priceMedFields) {
    if (data[field] !== undefined && priceMed === 0) {
      priceMed = Number(data[field]);
      logOperation('found_price_med_alternate', {
        requestId,
        field,
        value: priceMed
      });
    }
  }
  
  // Check nested objects (common pattern in some APIs)
  const nestedPaths = ['data', 'apiResponse', 'response', 'result'];
  for (const path of nestedPaths) {
    if (data[path] && typeof data[path] === 'object') {
      const nestedResult = scanForPriceData(data[path], requestId);
      if (nestedResult.priceMin > 0 && nestedResult.priceMed > 0) {
        return nestedResult;
      }
    }
  }
  
  return { priceMin, priceMed };
}

/**
 * Process and normalize raw valuation data
 * @param rawData Raw data from API
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param requestId For logging
 * @returns Processed valuation data
 */
export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string): ValuationData {
  try {
    // Log the incoming data structure for debugging
    logOperation('processing_raw_valuation', { 
      requestId,
      dataKeys: Object.keys(rawData),
      hasUserParams: !!rawData.functionResponse?.userParams,
      hasCalcValuation: !!rawData.functionResponse?.valuation?.calcValuation
    });
    
    // Extract vehicle details with multiple fallback paths
    const make = extractDataValue(rawData, [
      'functionResponse.userParams.make', 
      'make', 
      'manufacturer', 
      'brand'
    ], '');
    
    const model = extractDataValue(rawData, [
      'functionResponse.userParams.model', 
      'model', 
      'modelName'
    ], '');
    
    const year = extractDataValue(rawData, [
      'functionResponse.userParams.year', 
      'year', 
      'productionYear'
    ], 0);
    
    // Scan deeply for price data
    const { priceMin, priceMed } = scanForPriceData(rawData, requestId);
    
    logOperation('price_scan_results', {
      requestId,
      priceMin,
      priceMed,
      hasValidPrices: priceMin > 0 && priceMed > 0
    });
    
    // Calculate base price and valuation
    let basePrice = 0;
    if (priceMin > 0 && priceMed > 0) {
      basePrice = (priceMin + priceMed) / 2;
    } else {
      // Try direct price fields
      const price = extractDataValue(rawData, [
        'price',
        'value',
        'estimatedValue',
        'valuation'
      ], 0);
      
      if (price > 0) {
        basePrice = price;
      }
    }
    
    // If we still don't have price data, estimate it
    if (basePrice <= 0 && make && model && year > 0) {
      basePrice = estimateBasePriceByModel(make, model, year);
      logOperation('using_estimated_price', { 
        requestId,
        vin,
        make,
        model,
        year,
        basePrice
      }, 'warn');
    }
    
    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice, requestId);
    
    // Create standardized result object
    const result: ValuationData = {
      vin,
      make,
      model,
      year,
      mileage,
      price_min: priceMin,
      price_med: priceMed,
      basePrice,
      valuation: basePrice,
      reservePrice,
      averagePrice: priceMed || basePrice,
      estimationMethod: basePrice > 0 && (priceMin === 0 || priceMed === 0) ? 'make_model_year' : undefined
    };
    
    // Validate essential data
    const isValid = make && model && year > 0;
    const hasPriceData = basePrice > 0;
    
    // Log the processing result
    logOperation('valuation_data_processed', { 
      requestId,
      vin,
      isValid,
      hasPriceData,
      make,
      model,
      year,
      basePrice,
      reservePrice
    });
    
    return result;
  } catch (error) {
    logOperation('data_processing_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    // Return minimal data with VIN
    return { 
      vin, 
      mileage,
      make: '',
      model: '',
      valuation: 0,
      reservePrice: 0
    };
  }
}
