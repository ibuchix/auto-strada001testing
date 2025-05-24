
/**
 * Photo Category Mapping Utilities
 * Updated: 2025-05-24 - FIXED standardizePhotoCategory to check PHOTO_FIELD_MAP FIRST
 * Updated: 2025-05-24 - Simplified logic to prioritize direct mapping
 */

// Define valid photo categories
export const VALID_PHOTO_CATEGORIES = [
  'exterior_front',
  'exterior_rear', 
  'exterior_left',
  'exterior_right',
  'interior_front',
  'interior_rear',
  'dashboard',
  'engine_bay',
  'additional_photos',
  'rim_front_left',
  'rim_front_right', 
  'rim_rear_left',
  'rim_rear_right'
] as const;

export type ValidPhotoCategory = typeof VALID_PHOTO_CATEGORIES[number];

export const REQUIRED_PHOTO_FIELDS = [
  'exterior_front',
  'exterior_rear',
  'exterior_left', 
  'exterior_right',
  'interior_front',
  'dashboard'
] as const;

// Photo field mapping from camelCase to snake_case - THIS IS THE AUTHORITATIVE SOURCE
export const PHOTO_FIELD_MAP: Record<string, string> = {
  // Exterior photos
  'frontView': 'exterior_front',
  'rearView': 'exterior_rear',
  'driverSide': 'exterior_left',
  'passengerSide': 'exterior_right',
  'exteriorFront': 'exterior_front',
  'exteriorRear': 'exterior_rear',
  'exteriorLeft': 'exterior_left',
  'exteriorRight': 'exterior_right',
  
  // Interior photos
  'interiorFront': 'interior_front',
  'interiorRear': 'interior_rear',
  'dashboard': 'dashboard',
  
  // Engine
  'engine': 'engine_bay',
  'engineBay': 'engine_bay',
  
  // Trunk/boot
  'trunk': 'additional_photos',
  'boot': 'additional_photos',
  
  // Wheels/rims
  'rimFrontLeft': 'rim_front_left',
  'rimFrontRight': 'rim_front_right',
  'rimRearLeft': 'rim_rear_left',
  'rimRearRight': 'rim_rear_right',
  'wheelFrontLeft': 'rim_front_left',
  'wheelFrontRight': 'rim_front_right',
  'wheelRearLeft': 'rim_rear_left',
  'wheelRearRight': 'rim_rear_right',
  
  // Additional/misc
  'additionalPhotos': 'additional_photos',
  'mainPhoto': 'exterior_front',
  'odometer': 'dashboard'
};

/**
 * Standardizes photo category names to match database schema
 * PRIORITY: PHOTO_FIELD_MAP first, then validation, then sanitization
 */
export const standardizePhotoCategory = (category: string): string => {
  if (!category) {
    console.warn('[PhotoMapping] Empty category provided, using fallback');
    return 'additional_photos';
  }
  
  console.log(`[PhotoMapping] Processing category: "${category}"`);
  
  // STEP 1: Check direct mapping in PHOTO_FIELD_MAP first (highest priority)
  if (PHOTO_FIELD_MAP[category]) {
    const mapped = PHOTO_FIELD_MAP[category];
    console.log(`[PhotoMapping] ✓ Direct mapping: "${category}" -> "${mapped}"`);
    return mapped;
  }
  
  // STEP 2: Check if it's already a valid category
  if (VALID_PHOTO_CATEGORIES.includes(category as ValidPhotoCategory)) {
    console.log(`[PhotoMapping] ✓ Already valid: "${category}"`);
    return category;
  }
  
  // STEP 3: Sanitize and try common patterns
  const sanitized = category
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  // Check if sanitized version is in the map
  if (PHOTO_FIELD_MAP[sanitized]) {
    const mapped = PHOTO_FIELD_MAP[sanitized];
    console.log(`[PhotoMapping] ✓ Sanitized mapping: "${sanitized}" -> "${mapped}"`);
    return mapped;
  }
  
  // Check if sanitized version is valid
  if (VALID_PHOTO_CATEGORIES.includes(sanitized as ValidPhotoCategory)) {
    console.log(`[PhotoMapping] ✓ Sanitized valid: "${sanitized}"`);
    return sanitized;
  }
  
  // STEP 4: Pattern matching for common cases
  const patterns: Record<string, string> = {
    'front': 'exterior_front',
    'rear': 'exterior_rear', 
    'left': 'exterior_left',
    'right': 'exterior_right',
    'interior': 'interior_front',
    'dashboard': 'dashboard',
    'engine': 'engine_bay',
    'additional': 'additional_photos'
  };
  
  for (const [pattern, target] of Object.entries(patterns)) {
    if (sanitized.includes(pattern)) {
      console.log(`[PhotoMapping] ✓ Pattern match: "${sanitized}" contains "${pattern}" -> "${target}"`);
      return target;
    }
  }
  
  // STEP 5: Fallback
  console.warn(`[PhotoMapping] ⚠ No mapping found for "${category}", using fallback "additional_photos"`);
  return 'additional_photos';
};

/**
 * Validates if a category is required for form completion
 */
export const isRequiredPhotoCategory = (category: string): boolean => {
  const standardized = standardizePhotoCategory(category);
  return REQUIRED_PHOTO_FIELDS.includes(standardized as any);
};

/**
 * Gets all missing required photos from a photos object
 */
export const getMissingRequiredPhotos = (photos: Record<string, string>): string[] => {
  return REQUIRED_PHOTO_FIELDS.filter(field => !photos[field]);
};
