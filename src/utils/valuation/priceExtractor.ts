
/**
 * Utility to deeply scan objects for price-related data
 * Created: 2025-04-29 - Added for enhanced debugging of API responses
 * Updated: 2025-04-30 - Improved price data extraction from API response with nested structure handling
 */

interface PriceFieldsResult {
  [key: string]: any;
}

/**
 * Deeply scan an object for any fields that might contain pricing information
 * This helps identify where price data might be hiding in complex nested objects
 */
export function deepScanForPrices(data: any): PriceFieldsResult {
  const result: PriceFieldsResult = {};
  
  if (!data || typeof data !== 'object') {
    return result;
  }
  
  // Helper function to recursively scan the object
  function scan(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    // Check all properties at this level
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];
        
        // Check if this is a price-related field based on name
        const isPriceField = /price|valuation|value|cost|reserve|base|average|med|min|max/i.test(key);
        
        // If it's a numeric value and looks like a price field, add it to results
        if (isPriceField && typeof value === 'number' && value > 0) {
          result[currentPath] = value;
        } 
        // If it's an object or array, scan recursively
        else if (typeof value === 'object' && value !== null) {
          scan(value, currentPath);
        }
      }
    }
  }
  
  // Start the scan
  scan(data);
  return result;
}

/**
 * Extract direct price data from raw API response
 * This handles the specific Toyota API response structure
 */
export function extractDirectPrices(data: any): Record<string, number> {
  const prices: Record<string, number> = {
    valuation: 0,
    reservePrice: 0,
    basePrice: 0,
    averagePrice: 0
  };
  
  if (!data) return prices;
  
  // Log the raw data structure for debugging
  console.log('Raw price extraction input:', {
    dataType: typeof data,
    topLevelKeys: data ? Object.keys(data) : [],
    hasResponseData: !!data.data,
    makeValue: data.make,
    modelValue: data.model
  });
  
  // Try to extract direct price fields from response
  if (typeof data.reservePrice === 'number' && data.reservePrice > 0) {
    prices.reservePrice = data.reservePrice;
  }
  
  if (typeof data.valuation === 'number' && data.valuation > 0) {
    prices.valuation = data.valuation;
  }
  
  if (typeof data.basePrice === 'number' && data.basePrice > 0) {
    prices.basePrice = data.basePrice;
  }
  
  if (typeof data.averagePrice === 'number' && data.averagePrice > 0) {
    prices.averagePrice = data.averagePrice;
  }
  
  // Try nested data structure if direct fields are not present
  if (prices.valuation === 0 && prices.reservePrice === 0 && data.data) {
    if (typeof data.data.valuation === 'number' && data.data.valuation > 0) {
      prices.valuation = data.data.valuation;
    }
    if (typeof data.data.reservePrice === 'number' && data.data.reservePrice > 0) {
      prices.reservePrice = data.data.reservePrice;
    }
    if (typeof data.data.basePrice === 'number' && data.data.basePrice > 0) {
      prices.basePrice = data.data.basePrice;
    }
    if (typeof data.data.averagePrice === 'number' && data.data.averagePrice > 0) {
      prices.averagePrice = data.data.averagePrice;
    }
  }
  
  return prices;
}

/**
 * Extract price data from a valuation response with fallbacks
 */
export function extractPriceData(data: any) {
  if (!data) return { valuation: 0, reservePrice: 0, basePrice: 0, averagePrice: 0 };
  
  console.log('PRICE EXTRACTOR INPUT:', data);
  
  // First try direct price extraction
  const directPrices = extractDirectPrices(data);
  
  // Direct price fields
  const prices = {
    valuation: directPrices.valuation,
    reservePrice: directPrices.reservePrice,
    basePrice: directPrices.basePrice,
    averagePrice: directPrices.averagePrice,
  };
  
  // Log the direct extraction
  console.log('%c💰 DIRECT PRICE EXTRACTION:', 'background: #2196F3; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
  console.table(prices);
  
  // Check if any prices were found
  const hasPrices = prices.valuation > 0 || prices.reservePrice > 0 || 
                   prices.basePrice > 0 || prices.averagePrice > 0;
  
  if (!hasPrices) {
    console.warn('%c⚠️ NO DIRECT PRICES FOUND - USING DEEP SCAN', 'background: #FF9800; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
    
    // Try to find prices with deep scan
    const allPrices = deepScanForPrices(data);
    console.log('Deep scan results:', allPrices);
    
    // Calculate base price from Toyota API format if we have make/model data
    if (data.make && data.model && !hasPrices) {
      console.log('Attempting to calculate base price from Toyota API data for:', 
                 { make: data.make, model: data.model });
      
      // If we have a Toyota API response with make/model but no price, calculate it
      if (data.make === "TOYOTA" || data.make === "Toyota") {
        // Set base price based on model series and year
        let estimatedPrice = 0;
        
        const modelLower = String(data.model).toLowerCase();
        const year = parseInt(data.year) || 0;
        
        if (modelLower.includes('corolla')) {
          estimatedPrice = year >= 2018 ? 75000 : (year >= 2015 ? 60000 : 45000);
        } else if (modelLower.includes('camry')) {
          estimatedPrice = year >= 2018 ? 85000 : (year >= 2015 ? 70000 : 55000);
        } else if (modelLower.includes('rav4')) {
          estimatedPrice = year >= 2018 ? 100000 : (year >= 2015 ? 85000 : 70000);
        } else if (modelLower.includes('avensis')) {
          estimatedPrice = year >= 2018 ? 90000 : (year >= 2015 ? 75000 : 60000);
        } else if (modelLower.includes('yaris')) {
          estimatedPrice = year >= 2018 ? 65000 : (year >= 2015 ? 50000 : 35000);
        } else if (modelLower.includes('auris')) {
          estimatedPrice = year >= 2018 ? 70000 : (year >= 2015 ? 55000 : 40000);
        } else if (modelLower.includes('land cruiser')) {
          estimatedPrice = year >= 2018 ? 180000 : (year >= 2015 ? 150000 : 120000);
        } else if (modelLower.includes('hilux')) {
          estimatedPrice = year >= 2018 ? 120000 : (year >= 2015 ? 100000 : 80000);
        } else {
          // Default for other Toyota models
          estimatedPrice = 70000;
        }
        
        // Adjust for mileage
        const mileage = parseInt(data.mileage) || 0;
        if (mileage > 100000) {
          estimatedPrice = estimatedPrice * 0.8; // 20% reduction for high mileage
        } else if (mileage > 50000) {
          estimatedPrice = estimatedPrice * 0.9; // 10% reduction for medium mileage
        }
        
        prices.basePrice = estimatedPrice;
        prices.valuation = estimatedPrice;
        prices.averagePrice = estimatedPrice;
        
        // Calculate reserve price
        prices.reservePrice = calculateReservePrice(estimatedPrice);
        
        console.log('Calculated price for Toyota vehicle:', prices);
      }
    }
    
    // If still no prices, look for specific price fields in the deep scan results
    if (Object.keys(allPrices).length > 0 && 
       (prices.basePrice === 0 && prices.valuation === 0)) {
      // Find best candidates for each price type
      for (const path in allPrices) {
        if (path.includes('valuation') && !prices.valuation) {
          prices.valuation = allPrices[path];
        }
        if (path.includes('reserve') && !prices.reservePrice) {
          prices.reservePrice = allPrices[path];
        }
        if ((path.includes('base') || path.includes('price_med')) && !prices.basePrice) {
          prices.basePrice = allPrices[path];
        }
        if ((path.includes('average') || path.includes('price_med')) && !prices.averagePrice) {
          prices.averagePrice = allPrices[path];
        }
      }
      
      // If we found a base price but not a reserve price, calculate it
      if (prices.basePrice > 0 && prices.reservePrice === 0) {
        prices.reservePrice = calculateReservePrice(prices.basePrice);
      }
    }
  }
  
  // Final fallback: if we have vehicle data but no prices,
  // use default pricing based on make/model
  if (data.make && data.model && !prices.basePrice && !prices.valuation) {
    const estimatedPrice = estimateBasePriceByModel(data.make, data.model, data.year);
    prices.basePrice = estimatedPrice;
    prices.valuation = estimatedPrice;
    prices.averagePrice = estimatedPrice;
    prices.reservePrice = calculateReservePrice(estimatedPrice);
    
    console.log('Used estimation fallback for vehicle:', {
      make: data.make, 
      model: data.model,
      price: estimatedPrice,
      reservePrice: prices.reservePrice
    });
  }
  
  // Final logging of extraction results
  console.log('%c💰 FINAL PRICE EXTRACTION RESULT:', 'background: #4CAF50; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
  console.table(prices);
  
  return prices;
}

/**
 * Calculate reserve price based on base price
 */
export function calculateReservePrice(basePrice: number): number {
  if (!basePrice || basePrice <= 0) return 0;
  
  // Determine percentage based on price tier
  let percentageDiscount: number;
  
  if (basePrice <= 15000) percentageDiscount = 0.65;
  else if (basePrice <= 20000) percentageDiscount = 0.46;
  else if (basePrice <= 30000) percentageDiscount = 0.37;
  else if (basePrice <= 50000) percentageDiscount = 0.27;
  else if (basePrice <= 60000) percentageDiscount = 0.27;
  else if (basePrice <= 70000) percentageDiscount = 0.22;
  else if (basePrice <= 80000) percentageDiscount = 0.23;
  else if (basePrice <= 100000) percentageDiscount = 0.24;
  else if (basePrice <= 130000) percentageDiscount = 0.20;
  else if (basePrice <= 160000) percentageDiscount = 0.185;
  else if (basePrice <= 200000) percentageDiscount = 0.22;
  else if (basePrice <= 250000) percentageDiscount = 0.17;
  else if (basePrice <= 300000) percentageDiscount = 0.18;
  else if (basePrice <= 400000) percentageDiscount = 0.18;
  else if (basePrice <= 500000) percentageDiscount = 0.16;
  else percentageDiscount = 0.145;
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentageDiscount));
  return reservePrice;
}

/**
 * Estimate base price by make and model when API fails to provide price data
 */
export function estimateBasePriceByModel(make: string, model: string, year: number): number {
  console.log('Estimating price for:', { make, model, year });
  
  // Normalize inputs
  const makeLower = String(make).toLowerCase();
  const modelLower = String(model).toLowerCase();
  const yearNum = parseInt(String(year)) || new Date().getFullYear() - 5; // Default to 5 years old
  
  // Base prices for major brands (contemporary market values as baseline)
  const makeBasePrices: Record<string, number> = {
    'toyota': 70000,
    'honda': 65000,
    'nissan': 60000,
    'mazda': 62000,
    'mitsubishi': 58000,
    'subaru': 68000,
    'lexus': 120000,
    'bmw': 100000,
    'mercedes': 110000,
    'audi': 95000,
    'volkswagen': 65000,
    'ford': 55000,
    'chevrolet': 50000,
    'hyundai': 55000,
    'kia': 52000,
    'volvo': 85000,
    'land rover': 130000,
    'jaguar': 120000,
    'porsche': 180000,
    'tesla': 150000,
    'fiat': 45000,
    'jeep': 80000,
    'dodge': 75000,
    'chrysler': 70000,
    'mini': 60000
  };
  
  // Premium models that increase base price
  const premiumModels: string[] = [
    'suv', 'crossover', 'hybrid', 'electric', 'phev', 'turbo', 
    'premium', 'luxury', 'limited', 'sport', 'gt', 'rs', 'amg', 
    'sti', 'type r', 'gti', 'gli', '4x4', 'awd', 'all-wheel'
  ];
  
  // Budget models that decrease base price
  const budgetModels: string[] = [
    'basic', 'standard', 'economy', 'lite', 'base model', 'entry'
  ];
  
  // Get base price for make
  let basePrice = 60000; // Default base price if make not found
  for (const key in makeBasePrices) {
    if (makeLower.includes(key)) {
      basePrice = makeBasePrices[key];
      break;
    }
  }
  
  // Apply premium model adjustment
  let modelMultiplier = 1.0;
  for (const premium of premiumModels) {
    if (modelLower.includes(premium)) {
      modelMultiplier *= 1.2; // Multiple premium features can stack
    }
  }
  
  // Apply budget model adjustment
  for (const budget of budgetModels) {
    if (modelLower.includes(budget)) {
      modelMultiplier *= 0.8;
      break; // Only apply once for budget models
    }
  }
  
  // Apply age adjustment (newer cars are worth more)
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - yearNum);
  const ageMultiplier = Math.max(0.5, 1 - (age * 0.05)); // 5% reduction per year, minimum 50% of value
  
  // Calculate final estimated price
  const estimatedPrice = Math.round(basePrice * modelMultiplier * ageMultiplier);
  console.log('Price estimation result:', {
    basePrice,
    modelMultiplier,
    ageMultiplier,
    estimatedPrice
  });
  
  return estimatedPrice;
}
