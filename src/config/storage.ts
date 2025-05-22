
/**
 * Storage Configuration
 * Created: 2025-05-24
 * 
 * Centralized storage configuration to ensure consistent bucket naming
 * throughout the application
 */

// The only storage bucket used in the application
export const STORAGE_BUCKET = 'car-images';

// Storage path prefixes
export const STORAGE_PATHS = {
  CARS: 'cars/',
  TEMP: 'cars/temp/',
  DAMAGE: 'damage_photos/'
};

// Local storage keys that may contain stale bucket references
export const LOCAL_STORAGE_KEYS = {
  TEMP_UPLOADS: 'temp_car_uploads',
  TEMP_PHOTOS: 'tempPhotos',
  VEHICLE_PHOTOS: 'vehiclePhotos'
};

/**
 * Utility to clear stale storage references from localStorage
 * Should be called during app initialization
 */
export const clearStaleLocalStorage = (): void => {
  try {
    Object.values(LOCAL_STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      
      // Check if the item exists and contains reference to wrong bucket
      if (data && data.includes('car-photos')) {
        console.warn(`[StorageConfig] Removing stale localStorage data with incorrect bucket reference: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('[StorageConfig] Stale storage references cleared');
  } catch (e) {
    console.error('[StorageConfig] Error clearing storage:', e);
  }
};

