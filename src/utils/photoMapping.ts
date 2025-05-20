/**
 * Photo Field Mapping Utility
 * Created: 2025-05-20
 * Updated: 2025-05-23 - Added passenger_side to required fields and ensured consistent mapping
 * Updated: 2025-05-20 - Added odometer to required fields and ensured consistent mapping
 * 
 * Provides consistent mapping between client-side field names and server-side storage paths
 * to ensure photos are properly associated with car listings.
 */

// Map between UI field names and database field names
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
  
  // Damage photos
  'damage_front': 'damage_front',
  'damage_rear': 'damage_rear',
  'damage_side': 'damage_side',
  
  // Other specific photos
  'wheel': 'wheel',
  'roof': 'roof',
  
  // Keep existing mappings for backward compatibility
  'exterior_front': 'exterior_front',
  'exterior_rear': 'exterior_rear',
  'exterior_side': 'exterior_side',
  'passenger_side': 'passenger_side',
  'interior_front': 'interior_front',
  'interior_rear': 'interior_rear',
};

// Required photo fields that must be present
export const REQUIRED_PHOTO_FIELDS = [
  'dashboard',
  'exterior_front',
  'exterior_rear',
  'exterior_side',
  'passenger_side',
  'interior_front',
  'interior_rear',
  'odometer'  // Ensure odometer is in the required fields
];

/**
 * Standardizes a photo category name to ensure consistent naming
 * between client and server
 */
export const standardizePhotoCategory = (category: string): string => {
  // First check if this is a prefixed category like "required_exterior_front"
  if (category.startsWith('required_')) {
    const baseName = category.replace('required_', '');
    return PHOTO_FIELD_MAP[baseName] || baseName;
  }
  
  // Then check the mapping
  return PHOTO_FIELD_MAP[category] || category;
};
