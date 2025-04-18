
/**
 * Shared validation utilities for edge functions
 * Updated: 2025-04-18 - Enhanced property extraction and data normalization
 */

import { logOperation } from "./logging.ts";
import { ValuationData, TransmissionType } from "./types.ts";
import { calculateReservePrice } from "./reserve-price.ts";

// Validate required vehicle fields
export function validateVehicleData(
  data: Partial<ValuationData>,
  requestId: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields check
  if (!data.make) errors.push("Missing vehicle make");
  if (!data.model) errors.push("Missing vehicle model");
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push("Invalid vehicle year");
  }
  if (!data.vin || data.vin.length < 11 || data.vin.length > 17) {
    errors.push("Invalid VIN format");
  }
  if (data.mileage === undefined || data.mileage < 0) {
    errors.push("Invalid mileage value");
  }
  
  // Validate transmission type
  if (data.transmission && !["manual", "automatic"].includes(data.transmission)) {
    errors.push("Invalid transmission type");
  }
  
  // Validate price fields
  if (data.valuation !== undefined && (isNaN(data.valuation) || data.valuation < 0)) {
    errors.push("Invalid valuation amount");
  }
  if (data.reservePrice !== undefined && (isNaN(data.reservePrice) || data.reservePrice < 0)) {
    errors.push("Invalid reserve price");
  }
  
  const isValid = errors.length === 0;
  
  // Log validation results
  logOperation("vehicle_data_validation", {
    requestId,
    isValid,
    errors,
    fieldsPresent: Object.keys(data)
  });
  
  return { isValid, errors };
}

// Extract and normalize valuation data - improved with robust property extraction
export function normalizeValuationData(
  rawData: any,
  requestId: string
): Partial<ValuationData> {
  const normalized: Partial<ValuationData> = {};
  
  try {
    // Extract basic vehicle info with robust fallbacks
    normalized.make = extractNestedValue(rawData, ["make", "manufacturer", "brand"]);
    normalized.model = extractNestedValue(rawData, ["model", "modelName", "vehicleModel"]);
    normalized.year = extractNestedNumber(rawData, ["year", "productionYear", "modelYear"]);
    normalized.vin = extractNestedValue(rawData, ["vin", "vinNumber"]);
    normalized.mileage = extractNestedNumber(rawData, ["mileage", "odometer", "kilometers"]);
    normalized.transmission = extractTransmission(rawData);
    
    // Extract pricing information
    const priceMin = extractNestedNumber(rawData, ["price_min", "priceMin", "minimumPrice"]);
    const priceMed = extractNestedNumber(rawData, ["price_med", "priceMed", "medianPrice"]);
    
    if (priceMin > 0 && priceMed > 0) {
      // Calculate base price as average of min and median
      normalized.basePrice = (priceMin + priceMed) / 2;
      normalized.valuation = normalized.basePrice;
      
      // Calculate reserve price based on base price
      if (normalized.basePrice > 0) {
        normalized.reservePrice = calculateReservePrice(normalized.basePrice);
      }
    } else {
      // Try to extract direct valuation
      normalized.valuation = extractNestedNumber(rawData, [
        "price", "value", "valuation", "estimatedValue"
      ]);
      
      if (normalized.valuation > 0) {
        normalized.basePrice = normalized.valuation;
        normalized.reservePrice = calculateReservePrice(normalized.valuation);
      }
    }
    
    logOperation("data_normalization_success", {
      requestId,
      fieldsExtracted: Object.keys(normalized),
      hasValuation: !!normalized.valuation,
      hasReservePrice: !!normalized.reservePrice
    });
    
  } catch (error) {
    logOperation("data_normalization_error", {
      requestId,
      error: error.message,
      rawDataKeys: Object.keys(rawData)
    }, "error");
  }
  
  return normalized;
}

/**
 * Enhanced nested property extraction that supports deep paths
 * Can extract from nested objects with dot notation paths
 */
export function extractNestedValue(data: any, possibleKeys: string[]): string {
  if (!data) return "";
  
  // First try direct property access
  for (const key of possibleKeys) {
    // Handle dot notation for nested paths
    if (key.includes('.')) {
      const value = getNestedProperty(data, key);
      if (value && typeof value === "string") {
        return value.trim();
      }
      continue;
    }
    
    // Direct property access
    if (data[key] && typeof data[key] === "string") {
      return data[key].trim();
    }
  }
  
  // Try one level deep
  for (const mainKey of Object.keys(data)) {
    if (data[mainKey] && typeof data[mainKey] === "object") {
      for (const key of possibleKeys) {
        if (data[mainKey][key] && typeof data[mainKey][key] === "string") {
          return data[mainKey][key].trim();
        }
      }
    }
  }
  
  return "";
}

/**
 * Extract number values with robust fallbacks
 */
export function extractNestedNumber(data: any, possibleKeys: string[]): number {
  if (!data) return 0;
  
  // First try direct property access
  for (const key of possibleKeys) {
    // Handle dot notation for nested paths
    if (key.includes('.')) {
      const value = getNestedProperty(data, key);
      if (value !== undefined) {
        const num = Number(value);
        if (!isNaN(num) && num >= 0) {
          return num;
        }
      }
      continue;
    }
    
    // Direct property access
    const value = data[key];
    if (value !== undefined) {
      const num = Number(value);
      if (!isNaN(num) && num >= 0) {
        return num;
      }
    }
  }
  
  // Try one level deep
  for (const mainKey of Object.keys(data)) {
    if (data[mainKey] && typeof data[mainKey] === "object") {
      for (const key of possibleKeys) {
        const value = data[mainKey][key];
        if (value !== undefined) {
          const num = Number(value);
          if (!isNaN(num) && num >= 0) {
            return num;
          }
        }
      }
    }
  }
  
  return 0;
}

/**
 * Helper to get a nested property using dot notation
 * e.g., "functionResponse.userParams.make"
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
}

// Helper function to extract and validate transmission type
function extractTransmission(data: any): TransmissionType | undefined {
  const transmissionValue = extractNestedValue(data, [
    "transmission", "gearbox", "transmissionType"
  ]).toLowerCase();
  
  if (transmissionValue.includes("manual")) return "manual";
  if (transmissionValue.includes("auto")) return "automatic";
  return undefined;
}
