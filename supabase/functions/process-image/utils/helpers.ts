/**
 * Helper functions for process-image edge function
 */

/**
 * Maps between UI category names and database field names
 */
export const PHOTO_FIELD_MAP: Record<string, string> = {
  // Required photos - standard mapping
  'frontView': 'exterior_front',
  'rearView': 'exterior_rear',
  'driverSide': 'exterior_side',
  'passengerSide': 'passenger_side',
  'dashboard': 'dashboard',
  'interiorFront': 'interior_front',
  'interiorRear': 'interior_rear',
  'odometer': 'odometer',
  'trunk': 'trunk',
  'engine': 'engine',
  
  // Keep existing mappings for backward compatibility
  'exterior_front': 'exterior_front',
  'exterior_rear': 'exterior_rear',
  'exterior_side': 'exterior_side',
  'passenger_side': 'passenger_side',
  'interior_front': 'interior_front',
  'interior_rear': 'interior_rear',
  'dashboard': 'dashboard',
};

/**
 * Standardizes a photo category name to ensure consistent naming
 * between client and server
 */
export function standardizePhotoCategory(category: string): string {
  // First check if this is a prefixed category like "required_exterior_front"
  if (category.startsWith('required_')) {
    const baseName = category.replace('required_', '');
    return PHOTO_FIELD_MAP[baseName] || baseName;
  }
  
  // Then check the mapping
  return PHOTO_FIELD_MAP[category] || category;
}
