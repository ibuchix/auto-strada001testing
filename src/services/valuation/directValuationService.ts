
/**
 * Direct Valuation Service
 * Created: 2025-05-02 - Implements a direct API client approach with fallback mechanisms
 */

import { md5 } from "js-md5";
import { toast } from "sonner";

// API constants - these are public values provided in your custom instructions
const API_ID = "AUTOSTRA";
const API_SECRET = "A4FTFH54C3E37P2D34A16A7A4V41XKBF";

// Fallback options to try in sequence
export enum ValuationMethod {
  DIRECT_API = "direct_api",
  PROXY_CORS = "proxy_cors",
  LOCAL_CALCULATION = "local_calculation",
}

interface ValuationOptions {
  debug?: boolean;
  requestId?: string;
  useFallbacks?: boolean; // Whether to try alternative methods if primary fails
}

/**
 * Get a vehicle valuation directly from the API, bypassing edge functions
 */
export async function getDirectValuation(
  vin: string, 
  mileage: number,
  gearbox: string = 'manual',
  options: ValuationOptions = { useFallbacks: true }
) {
  // Clean VIN and validate inputs
  const cleanVin = vin.trim().replace(/\s+/g, '').toUpperCase();
  const validMileage = Math.max(0, Number(mileage) || 0);
  
  // Log request with diagnostics
  console.log(`[DirectValuation] Starting valuation request for VIN: ${cleanVin}`, {
    mileage: validMileage,
    gearbox,
    options,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Generate checksum for API authentication
    const checksumContent = API_ID + API_SECRET + cleanVin;
    const checksum = md5(checksumContent);
    
    // Try direct API first
    let result = await tryDirectApi(cleanVin, validMileage, gearbox, checksum);
    
    // If direct API fails and fallbacks are enabled, try alternative methods
    if (!result.success && options.useFallbacks) {
      console.log(`[DirectValuation] Primary method failed, trying fallbacks`);
      
      // Try proxy CORS service next
      result = await tryProxyCorsService(cleanVin, validMileage, gearbox, checksum);
      
      // If all remote methods fail, use local calculation as last resort
      if (!result.success) {
        result = await useLocalCalculation(cleanVin, validMileage, gearbox);
      }
    }
    
    // Final success/failure handling
    if (result.success && result.data) {
      return {
        success: true,
        data: result.data
      };
    } else {
      throw new Error(result.error || "Failed to get valuation");
    }
  } catch (error: any) {
    console.error(`[DirectValuation] Error:`, error);
    return {
      success: false,
      error: error.message || "Unknown error in direct valuation service"
    };
  }
}

/**
 * Try to get valuation directly from the API
 */
async function tryDirectApi(vin: string, mileage: number, gearbox: string, checksum: string) {
  try {
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

    console.log(`[DirectValuation] Calling API directly: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    const rawData = await response.text();
    
    // Try to parse the response as JSON
    try {
      const data = JSON.parse(rawData);
      
      // Process and normalize the data
      const processedData = processApiResponse(data, vin, mileage, gearbox);
      
      return {
        success: true,
        data: processedData,
        method: ValuationMethod.DIRECT_API
      };
    } catch (parseError) {
      console.error("[DirectValuation] JSON parse error:", parseError);
      return {
        success: false,
        error: "Failed to parse API response",
        rawData
      };
    }
  } catch (error: any) {
    console.error("[DirectValuation] Direct API error:", error);
    return { 
      success: false, 
      error: `Direct API failed: ${error.message}` 
    };
  }
}

/**
 * Try to get valuation through a CORS proxy
 */
async function tryProxyCorsService(vin: string, mileage: number, gearbox: string, checksum: string) {
  try {
    // Use a public CORS proxy (note: in production, you'd use a more reliable solution)
    const proxyUrl = `https://corsproxy.io/?`;
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    const fullUrl = proxyUrl + encodeURIComponent(apiUrl);
    
    console.log(`[DirectValuation] Trying proxy CORS service: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`Proxy returned status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const processedData = processApiResponse(data, vin, mileage, gearbox);
    
    return {
      success: true,
      data: processedData,
      method: ValuationMethod.PROXY_CORS
    };
  } catch (error: any) {
    console.error("[DirectValuation] Proxy CORS error:", error);
    return { 
      success: false, 
      error: `CORS proxy failed: ${error.message}` 
    };
  }
}

/**
 * Use local calculation as last resort
 */
async function useLocalCalculation(vin: string, mileage: number, gearbox: string) {
  try {
    console.log(`[DirectValuation] Using local estimation as fallback`);
    
    // Get basic vehicle info from VIN decoder
    const vinInfo = await decodeVinBasics(vin);
    
    if (!vinInfo.success) {
      throw new Error("Could not decode VIN information");
    }
    
    // Create a placeholder valuation
    // This would normally use a more sophisticated algorithm or dataset
    // but for now we'll use a simple estimation
    const baseYear = new Date().getFullYear();
    const year = vinInfo.year || baseYear - 5; // Assume 5 years old if unknown
    const ageDiscount = (baseYear - year) * 0.08; // 8% discount per year
    const mileageDiscount = (mileage / 10000) * 0.05; // 5% discount per 10k miles
    
    // Base values that correspond to average prices in your market
    const basePrice = getBasePriceEstimate(vinInfo.make, vinInfo.model, year);
    
    // Apply discounts
    const adjustedPrice = basePrice * (1 - ageDiscount) * (1 - mileageDiscount);
    const reservePrice = calculateReservePrice(adjustedPrice);
    
    // Construct a valuation result that matches the expected format
    const valuationData = {
      make: vinInfo.make || "Unknown Make",
      model: vinInfo.model || "Unknown Model",
      year: year,
      mileage: mileage,
      transmission: gearbox,
      vin: vin,
      basePrice: Math.round(adjustedPrice),
      reservePrice: Math.round(reservePrice),
      valuation: Math.round(adjustedPrice),
      averagePrice: Math.round(adjustedPrice * 1.1),
      isEstimated: true, // Flag to indicate this is an estimate
    };
    
    return {
      success: true,
      data: valuationData,
      method: ValuationMethod.LOCAL_CALCULATION
    };
  } catch (error: any) {
    console.error("[DirectValuation] Local calculation error:", error);
    return { 
      success: false, 
      error: `Local calculation failed: ${error.message}` 
    };
  }
}

/**
 * Get a base price estimate for a vehicle
 * This is a simplified implementation - in production you'd use a more
 * comprehensive database or API for this
 */
function getBasePriceEstimate(make?: string, model?: string, year?: number): number {
  // Default values if we don't have specific data
  if (!make || !model) return 25000;
  
  // Simple lookup for common makes
  const makeNormalized = make.toLowerCase();
  
  if (makeNormalized.includes("bmw")) return 45000;
  if (makeNormalized.includes("mercedes") || makeNormalized.includes("benz")) return 55000;
  if (makeNormalized.includes("audi")) return 40000;
  if (makeNormalized.includes("volks") || makeNormalized.includes("vw")) return 30000;
  if (makeNormalized.includes("ford")) return 25000;
  if (makeNormalized.includes("toyota")) return 30000;
  if (makeNormalized.includes("honda")) return 28000;
  
  // Default value if no specific match
  return 35000;
}

/**
 * Basic VIN decoder to get make/model/year
 * This is a simplified implementation - in production you'd use a proper VIN decoder API
 */
async function decodeVinBasics(vin: string): Promise<{ 
  success: boolean; 
  make?: string;
  model?: string;
  year?: number;
  error?: string;
}> {
  try {
    // Try to use a public NHTSA API for basic VIN decoding
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);
    
    if (!response.ok) {
      throw new Error(`VIN decoder returned status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.Results || data.Results.length === 0) {
      throw new Error("No results from VIN decoder");
    }
    
    const vinInfo = data.Results[0];
    
    return {
      success: true,
      make: vinInfo.Make || undefined,
      model: vinInfo.Model || undefined,
      year: vinInfo.ModelYear ? parseInt(vinInfo.ModelYear) : undefined
    };
  } catch (error) {
    console.error("Error decoding VIN:", error);
    
    // If the API call fails, try to extract basic info from the VIN itself
    // This is not reliable but can work as a last resort
    const yearCode = vin.charAt(9);
    const possibleYear = decodeYearCharacter(yearCode);
    
    return {
      success: false,
      year: possibleYear,
      error: error instanceof Error ? error.message : "Unknown error decoding VIN"
    };
  }
}

/**
 * Basic attempt to decode year from VIN position 10
 * This is not reliable for all manufacturers or years but can be a fallback
 */
function decodeYearCharacter(char: string): number {
  const currentYear = new Date().getFullYear();
  const yearCodes: Record<string, number> = {
    'A': 2010, 'B': 2011, 'C': 2012, 'D': 2013, 'E': 2014,
    'F': 2015, 'G': 2016, 'H': 2017, 'J': 2018, 'K': 2019,
    'L': 2020, 'M': 2021, 'N': 2022, 'P': 2023, 'R': 2024,
    'S': 2025, 'T': 2026, 'V': 2027, 'W': 2028, 'X': 2029,
    'Y': 2030, '1': 2001, '2': 2002, '3': 2003, '4': 2004,
    '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009,
    '0': 2000
  };
  
  return yearCodes[char.toUpperCase()] || currentYear - 5;
}

/**
 * Process API response to extract and normalize the valuation data
 */
function processApiResponse(data: any, vin: string, mileage: number, gearbox: string) {
  console.log("[DirectValuation] Processing API response:", {
    dataKeysLength: Object.keys(data).length,
    hasFunctionResponse: !!data.functionResponse
  });
  
  // Extract nested data from the API response
  const functionResponse = data.functionResponse || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Extract basic vehicle details
  const make = userParams.make || data.make || "Unknown";
  const model = userParams.model || data.model || "Unknown";
  const year = userParams.year || data.year || data.productionYear || new Date().getFullYear();
  
  // Extract pricing data
  const priceMin = calcValuation.price_min || data.price_min || 0;
  const priceMed = calcValuation.price_med || data.price_med || 0;
  
  // Calculate basePrice as average of min and median prices
  let basePrice = 0;
  
  if (priceMin > 0 && priceMed > 0) {
    basePrice = (Number(priceMin) + Number(priceMed)) / 2;
  } else {
    basePrice = data.basePrice || data.valuation || calcValuation.price || data.price || 0;
  }
  
  // Calculate reserve price
  const reservePrice = calculateReservePrice(basePrice);
  
  // Construct the final valuation data object
  const processedData = {
    vin,
    make,
    model,
    year,
    mileage,
    transmission: gearbox,
    basePrice,
    reservePrice,
    valuation: basePrice,
    averagePrice: priceMed || basePrice,
    price_min: priceMin,
    price_med: priceMed,
    functionResponse // Keep the original response for debugging
  };
  
  console.log("[DirectValuation] Processed data:", {
    make,
    model,
    year,
    basePrice,
    reservePrice
  });
  
  return processedData;
}

/**
 * Calculate reserve price based on base price tiers
 * This matches the reserve price calculation logic from your existing codebase
 */
export function calculateReservePrice(basePrice: number): number {
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}

/**
 * Utility function to attempt to fix the most common problems with VIN numbers
 */
export function cleanupVIN(vin: string): string {
  // Handle empty/undefined
  if (!vin) return "";
  
  // Convert to string and trim whitespace
  const trimmed = String(vin).trim();
  
  // Remove common invalid characters
  const cleaned = trimmed
    .replace(/[^\w\d]/g, '') // Remove non-alphanumeric characters
    .replace(/[oO]/g, '0')   // Replace O with 0
    .replace(/[iI]/g, '1')   // Replace I with 1
    .replace(/[qQ]/g, '0')   // Replace Q with 0
    .toUpperCase();          // Convert to uppercase
    
  return cleaned;
}
