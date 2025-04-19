
/**
 * Data processing utilities for get-vehicle-valuation
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { logOperation } from './logging.ts';
import { calculateReservePrice } from './price-calculator.ts';

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
  price?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
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
    
    // Extract pricing data with fallbacks
    const priceMin = extractDataValue(rawData, [
      'functionResponse.valuation.calcValuation.price_min',
      'price_min',
      'priceMin',
      'minPrice'
    ], 0);
    
    const priceMed = extractDataValue(rawData, [
      'functionResponse.valuation.calcValuation.price_med',
      'price_med',
      'priceMed',
      'medianPrice'
    ], 0);
    
    const price = extractDataValue(rawData, [
      'functionResponse.valuation.calcValuation.price',
      'price',
      'value',
      'estimatedValue'
    ], 0);
    
    // Calculate base price and reserve price
    let basePrice = 0;
    if (priceMin > 0 && priceMed > 0) {
      basePrice = (priceMin + priceMed) / 2;
    } else if (price > 0) {
      basePrice = price;
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
      price: basePrice,
      valuation: basePrice,
      reservePrice,
      averagePrice: priceMed || basePrice
    };
    
    // Validate essential data
    const isValid = make && model && year > 0 && basePrice > 0;
    
    // Log the processing result
    logOperation('valuation_data_processed', { 
      requestId,
      vin,
      isValid,
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
    return { vin, mileage };
  }
}
