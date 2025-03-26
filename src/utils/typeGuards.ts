
/**
 * Changes made:
 * - 2024-08-04: Fixed import for CarFeatures type
 */

import { CarFeatures } from "@/types/forms";

/**
 * Type guard for checking if an object is a valid CarFeatures object
 */
export const isCarFeatures = (features: any): features is CarFeatures => {
  if (!features || typeof features !== 'object') return false;
  
  // Check for required properties
  const requiredProps = ['satNav', 'panoramicRoof', 'reverseCamera', 'heatedSeats', 'upgradedSound'];
  
  for (const prop of requiredProps) {
    if (typeof features[prop] !== 'boolean') {
      return false;
    }
  }
  
  return true;
};

/**
 * Safely converts a features object to a valid CarFeatures object
 */
export const toCarFeatures = (features: any): CarFeatures => {
  if (isCarFeatures(features)) {
    return features;
  }
  
  // Return default features object if input is invalid
  return {
    satNav: false,
    panoramicRoof: false,
    reverseCamera: false,
    heatedSeats: false,
    upgradedSound: false
  };
};

/**
 * Type guard for checking if a value is a non-empty string
 */
export const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Type guard for checking if a value is a valid number or number string
 */
export const isNumeric = (value: any): boolean => {
  if (typeof value === 'number') return !isNaN(value);
  if (typeof value === 'string') return !isNaN(parseFloat(value));
  return false;
};

/**
 * Type guard for checking if a value is a valid date or date string
 */
export const isValidDate = (value: any): boolean => {
  if (value instanceof Date) return !isNaN(value.getTime());
  if (typeof value === 'string') {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
};
