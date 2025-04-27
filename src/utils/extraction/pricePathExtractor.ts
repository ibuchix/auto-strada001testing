
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
