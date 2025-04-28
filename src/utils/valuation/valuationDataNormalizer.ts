
/**
 * Normalizes valuation data from various sources into a consistent format
 * Created: 2025-04-28
 */

import { ValuationData } from "./valuationDataTypes";
import { normalizeTransmission } from "@/utils/validation/validateTypes";

/**
 * Normalizes valuation data from various sources into a consistent format
 */
export function normalizeValuationData(
  data: any,
  vin: string = '',
  mileage: number = 0
): ValuationData {
  // Initialize with default values and known data
  const result: ValuationData = {
    vin: vin || data?.vin || '',
    make: data?.make || '',
    model: data?.model || '',
    year: Number(data?.year) || 0,
    transmission: normalizeTransmission(data?.transmission || 'manual'),
    mileage: Number(mileage || data?.mileage) || 0,
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
  
  // Capture error information
  if (data?.error) {
    result.error = data.error;
  }
  
  if (data?.noData) {
    result.noData = true;
  }
  
  if (data?.apiSource) {
    result.apiSource = data.apiSource;
  }
  
  if (data?.errorDetails) {
    result.errorDetails = data.errorDetails;
  }
  
  // Extract nested pricing data if available
  if (data?.data?.valuation) {
    result.valuation = Number(data.data.valuation);
    result.reservePrice = Number(data.data.reservePrice || data.data.valuation);
    result.averagePrice = Number(data.data.averagePrice || data.data.valuation);
    result.basePrice = Number(data.data.basePrice || data.data.valuation);
  }
  
  // Direct pricing fields
  if (data?.valuation) {
    result.valuation = Number(data.valuation);
  }
  
  if (data?.reservePrice) {
    result.reservePrice = Number(data.reservePrice);
  } else if (result.valuation) {
    result.reservePrice = result.valuation;
  }
  
  if (data?.averagePrice) {
    result.averagePrice = Number(data.averagePrice);
  } else if (result.valuation) {
    result.averagePrice = result.valuation;
  }
  
  if (data?.basePrice) {
    result.basePrice = Number(data.basePrice);
  } else if (result.valuation) {
    result.basePrice = result.valuation;
  }
  
  // Handle nested data structure used in some API responses
  if (data?.functionResponse?.userParams) {
    if (!result.make) result.make = data.functionResponse.userParams.make;
    if (!result.model) result.model = data.functionResponse.userParams.model;
    if (!result.year) result.year = Number(data.functionResponse.userParams.year);
  }
  
  // Ensure we never return NaN values
  Object.keys(result).forEach((key) => {
    if (typeof result[key] === 'number' && isNaN(result[key])) {
      result[key] = 0;
    }
  });
  
  return result;
}
