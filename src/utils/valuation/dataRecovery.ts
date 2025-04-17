
/**
 * Utility functions for handling partial valuation data
 * Created: 2025-04-17
 * Updated: 2025-04-17 - Improved data recovery and standardized with new types
 */

import { ValuationData, TransmissionType } from "./valuationDataTypes";
import { sanitizePartialData } from "./valuationDataNormalizer";

export const salvagePartialData = (data: Partial<ValuationData>): Partial<ValuationData> | null => {
  // Sanitize incoming data
  const sanitizedData = sanitizePartialData(data);
  
  // Ensure we have minimal required data
  if (!sanitizedData.make || !sanitizedData.model || !sanitizedData.year) {
    console.warn('Cannot salvage partial data: missing required fields', sanitizedData);
    return null;
  }

  const partialData: Partial<ValuationData> = {
    make: sanitizedData.make,
    model: sanitizedData.model,
    year: sanitizedData.year,
    vin: sanitizedData.vin || '',
    transmission: sanitizedData.transmission || 'manual',
    mileage: sanitizedData.mileage || 0
  };

  // Store partial data for recovery with proper logging
  try {
    localStorage.setItem('valuationData', JSON.stringify(partialData));
    
    if (sanitizedData.vin) {
      localStorage.setItem('tempVIN', sanitizedData.vin);
    }
    
    if (sanitizedData.mileage) {
      localStorage.setItem('tempMileage', sanitizedData.mileage.toString());
    }
    
    if (sanitizedData.transmission) {
      localStorage.setItem('tempGearbox', sanitizedData.transmission);
    }
    
    console.log('Salvaged partial valuation data:', partialData);
  } catch (error) {
    console.error('Failed to store partial valuation data:', error);
  }

  return partialData;
};

export const retrieveSalvagedData = (): Partial<ValuationData> | null => {
  try {
    const savedData = localStorage.getItem('valuationData');
    if (!savedData) {
      return null;
    }
    
    const parsedData = JSON.parse(savedData) as Partial<ValuationData>;
    
    // Validate minimal required fields
    if (!parsedData.make || !parsedData.model || !parsedData.year) {
      console.warn('Retrieved incomplete salvaged data');
      return null;
    }
    
    console.log('Retrieved salvaged valuation data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Failed to retrieve salvaged valuation data:', error);
    return null;
  }
};

export const hasUsablePartialData = (data: Partial<ValuationData>): boolean => {
  const hasBasicInfo = !!(data?.make && data?.model && data?.year);
  console.log('Checking for usable partial data:', { hasBasicInfo, data });
  return hasBasicInfo;
};

export const clearSalvagedData = (): void => {
  try {
    localStorage.removeItem('valuationData');
    localStorage.removeItem('tempVIN');
    localStorage.removeItem('tempMileage');
    localStorage.removeItem('tempGearbox');
    console.log('Cleared salvaged valuation data');
  } catch (error) {
    console.error('Failed to clear salvaged valuation data:', error);
  }
};
