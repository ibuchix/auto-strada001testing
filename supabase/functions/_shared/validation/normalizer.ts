
/**
 * Data normalization utilities
 * Created: 2025-04-19
 */
import { ValuationData } from './types';
import { logOperation } from '../logging';
import { extractNestedValue, extractNestedNumber, extractTransmission } from './dataExtractor';
import { calculateReservePrice } from '../reserve-price';

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
      normalized.basePrice = (priceMin + priceMed) / 2;
      normalized.valuation = normalized.basePrice;
      
      if (normalized.basePrice > 0) {
        normalized.reservePrice = calculateReservePrice(normalized.basePrice);
      }
    } else {
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
