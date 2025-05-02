
/**
 * Form save utilities
 * Created: 2025-06-05
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Clears the form save cache for a specific user and car
 */
export const clearSaveCache = (userId: string, carId?: string) => {
  try {
    // Clear localStorage cache keys related to this form
    const keyPrefix = `form_save_${userId}_${carId || 'new'}`;
    
    // Find and remove all keys with this prefix
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(keyPrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log(`Cache cleared for user ${userId}, car ${carId || 'new'}`);
    return true;
  } catch (error) {
    console.error("Error clearing save cache:", error);
    return false;
  }
};

/**
 * Prepares form data for saving by cleaning up unnecessary fields
 */
export const prepareFormDataForSave = (data: CarListingFormData): Partial<CarListingFormData> => {
  // Create a copy to avoid mutating the original
  const formData = { ...data };
  
  // Remove any client-side only fields that shouldn't be saved
  delete (formData as any).tempData;
  delete (formData as any).validationErrors;
  
  return formData;
};
