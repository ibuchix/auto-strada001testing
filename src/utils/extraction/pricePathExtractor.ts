
/**
 * Enhanced price extractor for nested API response
 * Updated: 2025-04-27 - Complete rewrite with improved data extraction
 */

interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: 'manual' | 'automatic';
  mileage: number;
  fuel?: string;
  capacity?: string;
}

interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

/**
 * Extract price from the nested API response
 * @param data The API response data
 * @returns The extracted price or null if not found
 */
export function extractPrice(data: any): number | null {
  console.log('Extracting price from data:', JSON.stringify(data).substring(0, 200) + '...');
  
  try {
    // Check if we have the new nested structure
    if (data?.functionResponse?.valuation?.calcValuation?.price) {
      const price = Number(data.functionResponse.valuation.calcValuation.price);
      console.log('Found price in nested structure:', price);
      return price;
    }
    
    // Check for median price in nested structure
    if (data?.functionResponse?.valuation?.calcValuation?.price_med) {
      const price = Number(data.functionResponse.valuation.calcValuation.price_med);
      console.log('Found median price in nested structure:', price);
      return price;
    }
    
    // Check for average price in nested structure
    if (data?.functionResponse?.valuation?.calcValuation?.price_avr) {
      const price = Number(data.functionResponse.valuation.calcValuation.price_avr);
      console.log('Found average price in nested structure:', price);
      return price;
    }
    
    // Check for min price in nested structure
    if (data?.functionResponse?.valuation?.calcValuation?.price_min) {
      const price = Number(data.functionResponse.valuation.calcValuation.price_min);
      console.log('Found min price in nested structure:', price);
      return price;
    }
    
    // Check for max price in nested structure
    if (data?.functionResponse?.valuation?.calcValuation?.price_max) {
      const price = Number(data.functionResponse.valuation.calcValuation.price_max);
      console.log('Found max price in nested structure:', price);
      return price;
    }
    
    // Check for direct price fields (legacy format)
    if (data?.price && typeof data.price === 'number' && data.price > 0) {
      console.log('Found direct price:', data.price);
      return data.price;
    }
    
    if (data?.basePrice && typeof data.basePrice === 'number' && data.basePrice > 0) {
      console.log('Found basePrice:', data.basePrice);
      return data.basePrice;
    }
    
    if (data?.valuation && typeof data.valuation === 'number' && data.valuation > 0) {
      console.log('Found valuation:', data.valuation);
      return data.valuation;
    }
    
    // If no price found, log error and return null
    console.error('No valid price found in response');
    return null;
  } catch (error) {
    console.error('Error extracting price:', error);
    return null;
  }
}

/**
 * Extract vehicle details from the nested API response
 * @param data The API response data
 * @returns The extracted vehicle details
 */
export function extractVehicleDetails(data: any): VehicleDetails {
  try {
    // Check if we have the new nested structure
    if (data?.functionResponse?.userParams) {
      return {
        make: data.functionResponse.userParams.make || '',
        model: data.functionResponse.userParams.model || '',
        year: Number(data.functionResponse.userParams.year) || 0,
        vin: data.vin || '',
        transmission: data.functionResponse.userParams.gearbox || 'manual',
        mileage: Number(data.functionResponse.userParams.odometer) || 0,
        fuel: data.functionResponse.userParams.fuel || '',
        capacity: data.functionResponse.userParams.capacity || ''
      };
    }
    
    // Fallback to direct fields (legacy format)
    return {
      make: data.make || '',
      model: data.model || '',
      year: Number(data.year) || 0,
      vin: data.vin || '',
      transmission: data.transmission || 'manual',
      mileage: Number(data.mileage) || 0
    };
  } catch (error) {
    console.error('Error extracting vehicle details:', error);
    return {
      make: '',
      model: '',
      year: 0,
      vin: '',
      transmission: 'manual',
      mileage: 0
    };
  }
}

/**
 * Extract nested price data from API response
 * @param data The API response data 
 * @returns An object containing all available price data
 */
export function extractNestedPriceData(data: any): PriceData {
  const result: PriceData = {};
  
  try {
    // Check for nested structure in functionResponse
    if (data?.functionResponse?.valuation?.calcValuation) {
      const calcValuation = data.functionResponse.valuation.calcValuation;
      
      if (typeof calcValuation.price !== 'undefined') result.price = Number(calcValuation.price);
      if (typeof calcValuation.price_min !== 'undefined') result.price_min = Number(calcValuation.price_min);
      if (typeof calcValuation.price_max !== 'undefined') result.price_max = Number(calcValuation.price_max);
      if (typeof calcValuation.price_avr !== 'undefined') result.price_avr = Number(calcValuation.price_avr);
      if (typeof calcValuation.price_med !== 'undefined') result.price_med = Number(calcValuation.price_med);
      
      return result;
    }
    
    // Check for nested structure in rawApiResponse
    if (typeof data?.rawApiResponse === 'string') {
      try {
        const parsed = JSON.parse(data.rawApiResponse);
        if (parsed?.functionResponse?.valuation?.calcValuation) {
          const calcValuation = parsed.functionResponse.valuation.calcValuation;
          
          if (typeof calcValuation.price !== 'undefined') result.price = Number(calcValuation.price);
          if (typeof calcValuation.price_min !== 'undefined') result.price_min = Number(calcValuation.price_min);
          if (typeof calcValuation.price_max !== 'undefined') result.price_max = Number(calcValuation.price_max);
          if (typeof calcValuation.price_avr !== 'undefined') result.price_avr = Number(calcValuation.price_avr);
          if (typeof calcValuation.price_med !== 'undefined') result.price_med = Number(calcValuation.price_med);
          
          return result;
        }
      } catch (e) {
        console.error('Failed to parse rawApiResponse:', e);
      }
    } else if (data?.rawApiResponse?.functionResponse?.valuation?.calcValuation) {
      const calcValuation = data.rawApiResponse.functionResponse.valuation.calcValuation;
      
      if (typeof calcValuation.price !== 'undefined') result.price = Number(calcValuation.price);
      if (typeof calcValuation.price_min !== 'undefined') result.price_min = Number(calcValuation.price_min);
      if (typeof calcValuation.price_max !== 'undefined') result.price_max = Number(calcValuation.price_max);
      if (typeof calcValuation.price_avr !== 'undefined') result.price_avr = Number(calcValuation.price_avr);
      if (typeof calcValuation.price_med !== 'undefined') result.price_med = Number(calcValuation.price_med);
      
      return result;
    }
    
    // Direct access for pre-processed data
    if (typeof data?.price !== 'undefined') result.price = Number(data.price);
    if (typeof data?.price_min !== 'undefined') result.price_min = Number(data.price_min);
    if (typeof data?.price_max !== 'undefined') result.price_max = Number(data.price_max);
    if (typeof data?.price_avr !== 'undefined') result.price_avr = Number(data.price_avr); 
    if (typeof data?.price_med !== 'undefined') result.price_med = Number(data.price_med);
    
    return result;
  } catch (error) {
    console.error('Error extracting nested price data:', error);
    return result;
  }
}

/**
 * Calculate base price from nested price data
 * Uses the official formula: (price_min + price_med) / 2
 * @param priceData The price data object
 * @returns The calculated base price or 0 if no valid data
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  try {
    // If we have both price_min and price_med, use the official formula
    if (typeof priceData.price_min === 'number' && 
        typeof priceData.price_med === 'number' &&
        !isNaN(priceData.price_min) && 
        !isNaN(priceData.price_med) &&
        priceData.price_min > 0 &&
        priceData.price_med > 0) {
      
      const basePrice = (priceData.price_min + priceData.price_med) / 2;
      console.log('Calculated base price from min and median:', basePrice);
      return basePrice;
    }
    
    // If we have just the price, use that
    if (typeof priceData.price === 'number' && !isNaN(priceData.price) && priceData.price > 0) {
      console.log('Using price directly as base price:', priceData.price);
      return priceData.price;
    }
    
    // If we have just the median price, use that
    if (typeof priceData.price_med === 'number' && !isNaN(priceData.price_med) && priceData.price_med > 0) {
      console.log('Using median price as base price:', priceData.price_med);
      return priceData.price_med;
    }
    
    // If we have just the average price, use that
    if (typeof priceData.price_avr === 'number' && !isNaN(priceData.price_avr) && priceData.price_avr > 0) {
      console.log('Using average price as base price:', priceData.price_avr);
      return priceData.price_avr;
    }
    
    // If we have just the min price, use that
    if (typeof priceData.price_min === 'number' && !isNaN(priceData.price_min) && priceData.price_min > 0) {
      console.log('Using min price as base price:', priceData.price_min);
      return priceData.price_min;
    }
    
    // If we have just the max price, use that
    if (typeof priceData.price_max === 'number' && !isNaN(priceData.price_max) && priceData.price_max > 0) {
      console.log('Using max price as base price:', priceData.price_max);
      return priceData.price_max;
    }
    
    // No valid price found
    console.error('No valid price data found for base price calculation');
    return 0;
  } catch (error) {
    console.error('Error calculating base price from nested data:', error);
    return 0;
  }
}

/**
 * Calculate reserve price based on base price using the tiered percentage system
 * @param basePrice The base price to calculate from
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number): number {
  if (!basePrice || basePrice <= 0) return 0;
  
  let percentage: number;
  
  // Use the official tiered percentage system
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

  // Calculate: PriceX – (PriceX x PercentageY)
  return Math.round(basePrice - (basePrice * percentage));
}

