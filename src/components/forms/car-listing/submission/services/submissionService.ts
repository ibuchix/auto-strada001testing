
/**
 * Car Listing Submission Service
 * Created: 2025-05-19
 * Updated: 2025-05-19 - Fixed function signature to match usage in useCarForm.ts
 * Updated: 2025-05-20 - Fixed photo field consolidation and removed non-existent column references
 * Updated: 2025-06-01 - Improved error handling for JSONB structure errors
 * 
 * Handles the API calls for submitting car listing data.
 */

import { CarListingFormData } from "@/types/forms";
import { prepareFormDataForSubmission } from "../utils/submission";
import { validateRequiredPhotos } from "../utils/photoProcessor";
import { supabase } from "@/integrations/supabase/client";

export class ValidationSubmissionError extends Error {
  details?: any;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = "ValidationSubmissionError";
    this.details = details;
  }
}

export const submitCarListing = async (
  formData: CarListingFormData, 
  userId: string
): Promise<{ id: string }> => {
  try {
    console.log("Submitting car listing (CREATE):", {
      id: formData.id || "new",
      make: formData.make,
      model: formData.model
    });
    
    // Validate required photos before submission
    const missingPhotoFields = validateRequiredPhotos(formData);
    if (missingPhotoFields.length > 0) {
      console.error("Missing required photo fields:", missingPhotoFields);
      throw new ValidationSubmissionError(`Missing required photos: ${missingPhotoFields.join(', ')}`);
    }
    
    // Prepare data for submission, consolidating photo fields
    const preparedData = prepareFormDataForSubmission(formData);
    
    // Validate JSONB structure to catch potential errors early
    if (preparedData.required_photos && 
        typeof preparedData.required_photos !== 'object') {
      console.error("Invalid required_photos structure:", preparedData.required_photos);
      throw new ValidationSubmissionError("Invalid required_photos structure", {
        field: "required_photos",
        providedType: typeof preparedData.required_photos
      });
    }
    
    // Log the prepared data structure to help with debugging
    console.log("Prepared data structure:", {
      hasRequiredPhotos: !!preparedData.required_photos,
      photoFields: preparedData.required_photos ? Object.keys(preparedData.required_photos) : [],
      individualPhotoFields: Object.keys(preparedData).filter(key => 
        ['dashboard', 'exterior_front', 'exterior_rear', 'exterior_side', 
         'interior_front', 'interior_rear', 'odometer', 'trunk', 'engine'].includes(key)
      )
    });
    
    // Add seller ID
    preparedData.seller_id = userId;
    
    // Set timestamps
    if (!preparedData.created_at) {
      preparedData.created_at = new Date().toISOString();
    }
    preparedData.updated_at = new Date().toISOString();
    
    // Use Supabase RPC to leverage server-side function with better error handling
    const { data, error } = await supabase.rpc(
      'create_car_listing',
      {
        p_car_data: preparedData,
        p_user_id: userId
      }
    );
    
    if (error) {
      console.error("Error submitting car listing:", error);
      
      // Check for specific error messages related to JSONB structure
      if (error.message.includes('JSON') || error.message.includes('jsonb')) {
        throw new ValidationSubmissionError(`JSON structure error: ${error.message}`, {
          field: "required_photos",
          technicalDetails: error
        });
      }
      
      throw new ValidationSubmissionError(`Failed to submit car listing: ${error.message}`);
    }
    
    // Check for validation errors in the response
    if (data && !data.success && data.validation_errors) {
      console.error("Validation errors from server:", data.validation_errors);
      throw new ValidationSubmissionError(
        `Validation failed: ${data.message || 'Please check form data'}`,
        data.validation_errors
      );
    }
    
    // Check for car_id in response
    if (!data?.car_id) {
      throw new ValidationSubmissionError("No car ID returned from submission");
    }
    
    console.log("Car listing submitted successfully with ID:", data.car_id);
    return { id: data.car_id };
  } catch (error) {
    if (error instanceof ValidationSubmissionError) {
      throw error;
    }
    
    console.error("Error in submitCarListing:", error);
    throw new ValidationSubmissionError(`Failed to submit car listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
