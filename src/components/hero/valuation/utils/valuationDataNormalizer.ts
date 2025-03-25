
/**
 * Changes made:
 * - 2027-06-20: Created utility for normalizing valuation data as part of code refactoring
 */

import { ValuationData } from "../types";

/**
 * Normalize valuation result data to handle property name variations and type conversions
 */
export function normalizeValuationData(valuationResult: ValuationData): ValuationData {
  if (!valuationResult) return {};
  
  console.log('Normalizing valuation data');
  const normalized = { ...valuationResult };
  
  // Ensure either reservePrice or valuation is available (if one exists without the other)
  if (normalized.valuation !== undefined && normalized.reservePrice === undefined) {
    normalized.reservePrice = normalized.valuation;
    console.log('Using valuation as reservePrice:', normalized.valuation);
  } else if (normalized.reservePrice !== undefined && normalized.valuation === undefined) {
    normalized.valuation = normalized.reservePrice;
    console.log('Using reservePrice as valuation:', normalized.reservePrice);
  }
  
  // Convert string values to numbers if needed
  if (typeof normalized.valuation === 'string') {
    normalized.valuation = Number(normalized.valuation);
    console.log('Converted valuation string to number:', normalized.valuation);
  }
  if (typeof normalized.reservePrice === 'string') {
    normalized.reservePrice = Number(normalized.reservePrice);
    console.log('Converted reservePrice string to number:', normalized.reservePrice);
  }
  if (typeof normalized.averagePrice === 'string') {
    normalized.averagePrice = Number(normalized.averagePrice);
    console.log('Converted averagePrice string to number:', normalized.averagePrice);
  }
  
  return normalized;
}

/**
 * Validate if the normalized data has all required fields
 */
export function validateValuationData(data: ValuationData): boolean {
  if (!data) return false;
  
  // Check if we have any error
  if (data.error || data.noData) return false;
  
  // Check for essential car info
  const hasCarInfo = !!data.make && !!data.model;
  
  // Check for valuation data
  const hasValuation = (data.valuation !== undefined && data.valuation !== null) || 
                       (data.reservePrice !== undefined && data.reservePrice !== null);
  
  return hasCarInfo && hasValuation;
}
