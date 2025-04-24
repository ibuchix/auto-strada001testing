
/**
 * Vehicle data extraction utility
 * Created: 2025-05-01
 * 
 * This utility safely extracts vehicle data from the API response.
 */

import { extractData } from "../priceExtractor";

/**
 * Extract basic vehicle data from the API response
 * Tries multiple possible paths and handles fallbacks
 */
export function extractVehicleData(data: any): any {
  if (!data) return {};
  
  // Extract basic vehicle information
  const make = extractData(data, [
    'functionResponse.userParams.make', 
    'make'
  ], '');
  
  const model = extractData(data, [
    'functionResponse.userParams.model', 
    'model'
  ], '');
  
  const year = Number(extractData(data, [
    'functionResponse.userParams.year',
    'year',
    'productionYear'
  ], 0));
  
  const vin = extractData(data, ['vin'], '');
  
  const transmission = extractData(data, [
    'transmission', 
    'gearbox'
  ], 'manual');
  
  const mileage = Number(extractData(data, [
    'mileage',
    'odometer'
  ], 0));
  
  console.log('[DATA-EXTRACTOR] Extracted vehicle data:', {
    make, model, year, vin, transmission, mileage
  });
  
  return {
    make,
    model,
    year,
    vin,
    transmission,
    mileage
  };
}
