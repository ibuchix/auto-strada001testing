
/**
 * Shared validation utilities for edge functions
 * Created: 2025-04-17
 */

import { logOperation } from "./logging.ts";
import { ValuationData, TransmissionType } from "./types.ts";

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

// Extract and normalize valuation data
export function normalizeValuationData(
  rawData: any,
  requestId: string
): Partial<ValuationData> {
  const normalized: Partial<ValuationData> = {};
  
  try {
    // Extract basic vehicle info
    normalized.make = extractString(rawData, ["make", "manufacturer", "brand"]);
    normalized.model = extractString(rawData, ["model", "modelName", "vehicleModel"]);
    normalized.year = extractNumber(rawData, ["year", "productionYear", "modelYear"]);
    normalized.vin = extractString(rawData, ["vin", "vinNumber"]);
    normalized.mileage = extractNumber(rawData, ["mileage", "odometer", "kilometers"]);
    normalized.transmission = extractTransmission(rawData);
    
    // Extract pricing information
    const priceMin = extractNumber(rawData, ["price_min", "priceMin", "minimumPrice"]);
    const priceMed = extractNumber(rawData, ["price_med", "priceMed", "medianPrice"]);
    
    if (priceMin > 0 && priceMed > 0) {
      // Calculate base price as average of min and median
      normalized.basePrice = (priceMin + priceMed) / 2;
      
      // Calculate reserve price based on base price
      if (normalized.basePrice > 0) {
        normalized.reservePrice = calculateReservePrice(normalized.basePrice);
        normalized.valuation = normalized.basePrice;
      }
    } else {
      // Try to extract direct valuation
      normalized.valuation = extractNumber(rawData, [
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

// Helper function to extract string values
function extractString(data: any, possibleKeys: string[]): string {
  for (const key of possibleKeys) {
    if (data[key] && typeof data[key] === "string") {
      return data[key].trim();
    }
  }
  return "";
}

// Helper function to extract number values
function extractNumber(data: any, possibleKeys: string[]): number {
  for (const key of possibleKeys) {
    const value = data[key];
    if (value !== undefined) {
      const num = Number(value);
      if (!isNaN(num) && num >= 0) {
        return num;
      }
    }
  }
  return 0;
}

// Helper function to extract and validate transmission type
function extractTransmission(data: any): TransmissionType | undefined {
  const transmissionValue = extractString(data, [
    "transmission", "gearbox", "transmissionType"
  ]).toLowerCase();
  
  if (transmissionValue.includes("manual")) return "manual";
  if (transmissionValue.includes("auto")) return "automatic";
  return undefined;
}

// Calculate reserve price based on base price tiers
function calculateReservePrice(basePrice: number): number {
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
  
  return Math.round(basePrice - (basePrice * percentage));
}
