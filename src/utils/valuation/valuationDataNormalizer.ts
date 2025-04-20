
/**
 * Changes made:
 * - 2025-04-20: Enhanced data normalization with better price data extraction
 * - 2025-04-20: Added detailed logging and validation
 */

import { extractPrice, calculateReservePrice } from './priceExtractor';
import { ValuationData, TransmissionType } from './valuationDataTypes';

export function normalizeValuationData(data: any): ValuationData {
  // Log the raw data for debugging
  console.log('Normalizing valuation data:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    timestamp: new Date().toISOString()
  });

  // Extract base price using our utility
  const basePrice = extractPrice(data);
  
  // Calculate reserve price if we have a base price
  const reservePrice = basePrice > 0 ? calculateReservePrice(basePrice) : 0;
  
  // Normalize the transmission type
  const transmission = normalizeTransmission(data?.transmission);

  const normalized: ValuationData = {
    make: data?.make || '',
    model: data?.model || '',
    year: data?.year || data?.productionYear || 0,
    vin: data?.vin || '',
    transmission,
    mileage: typeof data?.mileage === 'number' ? data.mileage : 0,
    valuation: data?.valuation || reservePrice || 0,
    reservePrice: data?.reservePrice || reservePrice || 0,
    averagePrice: data?.averagePrice || basePrice || 0,
    basePrice: basePrice,
    
    // API metadata
    apiSource: data?.apiSource || 'default',
    valuationDate: data?.valuationDate || new Date().toISOString(),
    
    // Status flags
    error: data?.error,
    noData: data?.noData,
    isExisting: data?.isExisting
  };

  // Log the normalized result
  console.log('Normalized valuation data:', {
    make: normalized.make,
    model: normalized.model,
    year: normalized.year,
    basePrice: normalized.basePrice,
    reservePrice: normalized.reservePrice,
    hasError: !!normalized.error
  });

  return normalized;
}

function normalizeTransmission(transmission: any): TransmissionType {
  if (typeof transmission === 'string') {
    const normalized = transmission.toLowerCase();
    return normalized === 'automatic' ? 'automatic' : 'manual';
  }
  return 'manual'; // Default to manual if not specified
}
