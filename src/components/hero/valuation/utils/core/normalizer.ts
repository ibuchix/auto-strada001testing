
/**
 * Core data normalization functionality
 * Created: 2025-04-19 - Split from valuationDataNormalizer.ts
 * Modified: 2025-04-23 - Updated to use consolidated price utilities
 */

import { ValuationData, TransmissionType } from "../../types";
import { extractPrice, calculateReservePrice } from "@/utils/priceUtils";
import { findNestedProperty } from "./propertyUtils";

export function normalizeValuationData(data: any): ValuationData {
  if (!data) {
    console.warn('Normalizing empty valuation data');
    return {} as ValuationData;
  }
  
  console.log('Normalizing raw valuation data:', {
    dataKeys: Object.keys(data),
    hasDirectMake: !!data.make,
    hasDirectModel: !!data.model,
    hasDirectYear: !!data.year
  });
  
  // Extract nested data from various possible locations
  const nestedData = data.data || data.apiResponse || data.valuationDetails || data.apiData || {};
  const searchData = data.search_data || nestedData.search_data || {};
  const externalApiData = searchData || nestedData || {};
  
  // Extract core vehicle data
  const make = extractVehicleProperty('make', data, nestedData, externalApiData);
  const model = extractVehicleProperty('model', data, nestedData, externalApiData);
  const year = extractVehicleYear(data, nestedData, externalApiData);
  
  // Extract and calculate pricing data
  const { basePrice, reservePrice } = extractPricingData(data);
  
  // Create normalized valuation data object
  const normalized: ValuationData = {
    make: make || '',
    model: model || '',
    year: year || new Date().getFullYear(),
    vin: data.vin || '',
    mileage: data.mileage || 0,
    transmission: validateTransmission(data.transmission),
    valuation: basePrice,
    reservePrice: reservePrice,
    averagePrice: data.averagePrice || data.basePrice || data.price_med || 
                 nestedData.averagePrice || nestedData.price_med || basePrice,
    isExisting: !!data.isExisting,
    error: data.error || '',
    noData: !!data.noData
  };
  
  logNormalizedData(normalized);
  
  return normalized;
}

function extractVehicleProperty(
  prop: 'make' | 'model', 
  data: any, 
  nestedData: any, 
  externalApiData: any
): string {
  return data[prop] || 
         nestedData[prop] || 
         externalApiData[prop] ||
         findNestedProperty(data, prop) || 
         '';
}

function extractVehicleYear(data: any, nestedData: any, externalApiData: any): number {
  return data.year || 
         nestedData.year || 
         externalApiData.year ||
         data.productionYear || 
         nestedData.productionYear ||
         externalApiData.productionYear ||
         findNestedProperty(data, 'year') ||
         findNestedProperty(data, 'productionYear') ||
         0;
}

function validateTransmission(transmission: any): TransmissionType {
  return (transmission === 'manual' || transmission === 'automatic') 
    ? transmission as TransmissionType 
    : 'manual' as TransmissionType;
}

function extractPricingData(data: any) {
  const extractedPrice = extractPrice(data) || 0;
  const basePrice = extractedPrice || data.price_med || data.valuation || 0;
  const reservePrice = data.reservePrice || 
                      (basePrice ? calculateReservePrice(basePrice) : 0);
  
  return { basePrice, reservePrice };
}

function logNormalizedData(normalized: ValuationData) {
  console.log('Normalized valuation data:', {
    make: normalized.make,
    model: normalized.model,
    year: normalized.year,
    valuation: normalized.valuation,
    reservePrice: normalized.reservePrice,
    hasAllRequiredFields: !!(normalized.make && normalized.model && normalized.year)
  });
}
