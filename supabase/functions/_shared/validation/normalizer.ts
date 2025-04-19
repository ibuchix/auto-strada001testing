
/**
 * Data normalization utilities
 * Created: 2025-04-19
 */

import { ValuationData, TransmissionType } from './types';

/**
 * Normalize valuation data from different sources into a consistent format
 * @param data Raw valuation data from various sources
 * @returns Normalized ValuationData object
 */
export function normalizeValuationData(data: Record<string, any>): ValuationData {
  return {
    vin: data.vin || '',
    make: data.make || data.manufacturer || '',
    model: data.model || data.modelName || '',
    year: Number(data.year || data.productionYear || new Date().getFullYear()),
    mileage: Number(data.mileage || data.odometer || 0),
    transmission: normalizeTransmission(data.transmission || data.gearbox),
    valuation: Number(data.valuation || data.reservePrice || data.price || 0),
    reservePrice: Number(data.reservePrice || data.valuation || data.price || 0),
    averagePrice: Number(data.averagePrice || data.basePrice || data.price_med || 0),
    basePrice: Number(data.basePrice || data.averagePrice || ((data.price_min + data.price_med) / 2) || 0),
    minPrice: Number(data.minPrice || data.price_min || 0),
    maxPrice: Number(data.maxPrice || data.price_max || 0),
    currency: data.currency || 'PLN'
  };
}

/**
 * Normalize transmission type values
 * @param value Input transmission value
 * @returns Normalized TransmissionType
 */
export function normalizeTransmission(value: any): TransmissionType {
  if (!value) return undefined;
  
  const strValue = String(value).toLowerCase().trim();
  
  if (['auto', 'automatic', 'automat', 'automatyczna'].includes(strValue)) {
    return 'automatic';
  }
  
  if (['manual', 'man', 'manualna', 'ręczna'].includes(strValue)) {
    return 'manual';
  }
  
  return undefined;
}

/**
 * Ensure number value is valid
 * @param value Value to normalize
 * @param defaultValue Default value if invalid
 * @returns Normalized number
 */
export function normalizeNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Ensure string value is valid
 * @param value Value to normalize
 * @param defaultValue Default value if invalid
 * @returns Normalized string
 */
export function normalizeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;
  return String(value).trim();
}

/**
 * Ensure year value is valid
 * @param value Year value to normalize
 * @returns Normalized year
 */
export function normalizeYear(value: any): number {
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  
  if (isNaN(year) || year < 1900 || year > currentYear + 1) {
    return currentYear;
  }
  
  return year;
}
