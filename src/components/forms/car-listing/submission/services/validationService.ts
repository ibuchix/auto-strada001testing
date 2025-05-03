
/**
 * Validation Service
 * Updated: 2025-05-04 - Fixed TypeScript errors with error handling
 */

import { CarListingFormData } from '@/types/forms';
import { validateVIN } from '@/validation/carListing';

/**
 * Validates car form data before submission
 */
export async function validateForm(formData: CarListingFormData): Promise<boolean> {
  try {
    const errors: string[] = [];
    
    // Check for required fields
    if (!formData.make) {
      errors.push('Make is required');
    }
    
    if (!formData.model) {
      errors.push('Model is required');
    }
    
    if (!formData.vin) {
      errors.push('VIN is required');
    } else if (!validateVIN(formData.vin)) {
      errors.push('VIN is invalid');
    }
    
    if (!formData.year || formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      errors.push('Valid year is required');
    }
    
    if (formData.mileage === undefined || formData.mileage < 0) {
      errors.push('Valid mileage is required');
    }
    
    // Return true if no errors
    return errors.length === 0;
  } catch (error) {
    console.error("Validation error:", error);
    return false;
  }
}
