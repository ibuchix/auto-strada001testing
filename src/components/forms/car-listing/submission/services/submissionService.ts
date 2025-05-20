
/**
 * Submission Service
 * Created: 2025-05-30
 * Updated with proper camelCase field handling
 */

import { CarListingFormData } from "@/types/forms";
import { prepareFormDataForSubmission } from "../utils/dataPreparation";
import { transformFormToDb } from "@/utils/dbTransformers";
import { validateRequiredPhotos } from "../utils/photoValidator";

// Interface for submission result
export interface SubmissionResult {
  success: boolean;
  error?: string;
  carId?: string;
}

/**
 * Service to handle form submission to the backend
 */
export class SubmissionService {
  /**
   * Validate the form data before submission
   */
  validateFormData(formData: CarListingFormData): string[] {
    return validateRequiredPhotos(formData);
  }
  
  /**
   * Process and transform form data for submission
   */
  prepareFormData(formData: CarListingFormData): Record<string, any> {
    // First prepare the form data with business logic transformations
    const preparedData = prepareFormDataForSubmission(formData);
    
    // Then transform to snake_case for database
    return transformFormToDb(preparedData);
  }
  
  /**
   * Submit the form data to the backend
   */
  async submitFormData(formData: CarListingFormData): Promise<SubmissionResult> {
    try {
      // First check for required photos
      const missingPhotos = this.validateFormData(formData);
      if (missingPhotos.length > 0) {
        return {
          success: false,
          error: `Missing required photos: ${missingPhotos.join(', ')}`
        };
      }
      
      // Prepare data for submission
      const dbData = this.prepareFormData(formData);
      
      // In a real implementation, this would send data to your API
      // For now, we'll simulate a successful submission
      console.log("Submitting form data to API:", dbData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        carId: formData.id || 'new-car-id'
      };
    } catch (error) {
      console.error("Error submitting form:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
}

// Create singleton instance
export const submissionService = new SubmissionService();
