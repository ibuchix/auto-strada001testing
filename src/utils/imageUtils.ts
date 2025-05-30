
/**
 * Image Utilities for Car Listings
 * Created: 2025-05-30 - Phase 3: Strengthen blob URL rejection and validation
 */

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Check if a URL is a blob URL that should be rejected
 */
export const isBlobUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('blob:') || url.includes('blob:');
};

/**
 * Check if a URL is a data URL that should be rejected
 */
export const isDataUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:');
};

/**
 * Check if a URL is a temporary object URL that should be rejected
 */
export const isObjectUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('objectURL') || url.includes('createObjectURL');
};

/**
 * Validate that an image URL is permanent and safe to store
 */
export const validateImageUrl = (url: string): ImageValidationResult => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is empty or invalid'
    };
  }

  // Reject blob URLs
  if (isBlobUrl(url)) {
    return {
      isValid: false,
      error: 'Blob URLs are not allowed - use permanent storage URLs only'
    };
  }

  // Reject data URLs
  if (isDataUrl(url)) {
    return {
      isValid: false,
      error: 'Data URLs are not allowed - use permanent storage URLs only'
    };
  }

  // Reject object URLs
  if (isObjectUrl(url)) {
    return {
      isValid: false,
      error: 'Object URLs are not allowed - use permanent storage URLs only'
    };
  }

  // Check for valid URL format
  try {
    new URL(url);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }

  // Check for Supabase storage URL pattern (recommended)
  const isSupabaseUrl = url.includes('supabase') && url.includes('storage');
  if (isSupabaseUrl) {
    return {
      isValid: true,
      sanitizedUrl: url.trim()
    };
  }

  // Allow other valid HTTP/HTTPS URLs but warn
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return {
      isValid: true,
      sanitizedUrl: url.trim()
    };
  }

  return {
    isValid: false,
    error: 'URL must be a valid HTTP/HTTPS URL'
  };
};

/**
 * Validate an array of image URLs
 */
export const validateImageUrls = (urls: string[]): {
  validUrls: string[];
  invalidUrls: { url: string; error: string }[];
} => {
  const validUrls: string[] = [];
  const invalidUrls: { url: string; error: string }[] = [];

  urls.forEach(url => {
    const validation = validateImageUrl(url);
    if (validation.isValid && validation.sanitizedUrl) {
      validUrls.push(validation.sanitizedUrl);
    } else {
      invalidUrls.push({
        url,
        error: validation.error || 'Unknown validation error'
      });
    }
  });

  return { validUrls, invalidUrls };
};

/**
 * Clean and validate required photos object
 */
export const validateRequiredPhotos = (photos: Record<string, string>): {
  validPhotos: Record<string, string>;
  invalidPhotos: { key: string; url: string; error: string }[];
} => {
  const validPhotos: Record<string, string> = {};
  const invalidPhotos: { key: string; url: string; error: string }[] = [];

  Object.entries(photos).forEach(([key, url]) => {
    const validation = validateImageUrl(url);
    if (validation.isValid && validation.sanitizedUrl) {
      validPhotos[key] = validation.sanitizedUrl;
    } else {
      invalidPhotos.push({
        key,
        url,
        error: validation.error || 'Unknown validation error'
      });
    }
  });

  return { validPhotos, invalidPhotos };
};

/**
 * Get a safe placeholder image URL for missing images
 */
export const getPlaceholderImageUrl = (): string => {
  return '/api/placeholder/400/300';
};

/**
 * Check if an image URL needs to be replaced with a placeholder
 */
export const needsPlaceholder = (url: string): boolean => {
  if (!url) return true;
  return !validateImageUrl(url).isValid;
};
