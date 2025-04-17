
/**
 * Utility functions for handling partial valuation data
 * Created: 2025-04-17
 */

interface PartialValuationData {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  transmission?: string;
  mileage?: number;
}

export const salvagePartialData = (data: PartialValuationData) => {
  if (!data.make || !data.model || !data.year) {
    return null;
  }

  const partialData = {
    make: data.make,
    model: data.model,
    year: data.year,
    vin: data.vin || '',
    transmission: data.transmission || 'manual',
    mileage: data.mileage || 0
  };

  // Store partial data for recovery
  localStorage.setItem('valuationData', JSON.stringify(partialData));
  if (data.vin) localStorage.setItem('tempVIN', data.vin);
  if (data.mileage) localStorage.setItem('tempMileage', data.mileage.toString());
  if (data.transmission) localStorage.setItem('tempGearbox', data.transmission);

  return partialData;
};

export const hasUsablePartialData = (data: PartialValuationData): boolean => {
  return !!(data.make && data.model && data.year);
};
