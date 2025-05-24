
/**
 * Photo Category Mapping Utilities
 * Updated: 2025-05-24 - Added comprehensive validation and sanitization
 * Updated: 2025-05-24 - Added PHOTO_FIELD_MAP for camelCase to snake_case conversion
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

// Photo field mapping from camelCase to snake_case
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
 * Sanitizes and validates a photo category name
 */
export const sanitizePhotoCategory = (category: string): string => {
  if (!category || typeof category !== 'string') {
    console.warn('[PhotoMapping] Invalid category input:', category);
    return 'additional_photos';
  }
  
  // Convert to lowercase and replace spaces/special chars with underscores
  const sanitized = category
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  console.log(`[PhotoMapping] Sanitized category "${category}" to "${sanitized}"`);
  return sanitized || 'additional_photos';
};

/**
 * Standardizes photo category names to match database schema
 */
export const standardizePhotoCategory = (category: string): string => {
  if (!category) {
    console.warn('[PhotoMapping] Empty category provided, using fallback');
    return 'additional_photos';
  }
  
  console.log(`[PhotoMapping] Standardizing category:`, { 
    input: category, 
    type: typeof category 
  });
  
  // First sanitize the input
  const sanitized = sanitizePhotoCategory(category);
  
  // Common mapping patterns
  const categoryMappings: Record<string, string> = {
    // Exterior photos
    'front': 'exterior_front',
    'rear': 'exterior_rear', 
    'left': 'exterior_left',
    'right': 'exterior_right',
    'exterior': 'exterior_front',
    
    // Interior photos
    'interior': 'interior_front',
    'inside': 'interior_front',
    'dashboard': 'dashboard',
    'dash': 'dashboard',
    
    // Engine
    'engine': 'engine_bay',
    'engine_bay': 'engine_bay',
    'hood': 'engine_bay',
    
    // Rims
    'rim_fl': 'rim_front_left',
    'rim_fr': 'rim_front_right',
    'rim_rl': 'rim_rear_left', 
    'rim_rr': 'rim_rear_right',
    'wheel_front_left': 'rim_front_left',
    'wheel_front_right': 'rim_front_right',
    'wheel_rear_left': 'rim_rear_left',
    'wheel_rear_right': 'rim_rear_right',
    
    // Additional/misc
    'additional': 'additional_photos',
    'misc': 'additional_photos',
    'other': 'additional_photos'
  };
  
  // Check direct mapping first
  if (categoryMappings[sanitized]) {
    const mapped = categoryMappings[sanitized];
    console.log(`[PhotoMapping] Mapped "${sanitized}" to "${mapped}"`);
    return mapped;
  }
  
  // Check if it's already a valid category
  if (VALID_PHOTO_CATEGORIES.includes(sanitized as ValidPhotoCategory)) {
    console.log(`[PhotoMapping] Category "${sanitized}" is already valid`);
    return sanitized;
  }
  
  // Try partial matching for complex category names
  for (const [key, value] of Object.entries(categoryMappings)) {
    if (sanitized.includes(key)) {
      console.log(`[PhotoMapping] Partial match: "${sanitized}" contains "${key}", mapped to "${value}"`);
      return value;
    }
  }
  
  // Fallback to additional_photos
  console.warn(`[PhotoMapping] No mapping found for "${category}", using fallback "additional_photos"`);
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
