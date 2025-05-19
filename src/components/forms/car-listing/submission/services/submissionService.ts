
/**
 * Car Listing Submission Service
 * Created: 2025-05-19
 * 
 * Handles the API calls for submitting car listing data.
 */

import { CarListingFormData } from "@/types/forms";
import { prepareFormDataForSubmission } from "../utils/submission";
import { validateRequiredPhotos } from "../utils/photoProcessor";
import { supabase } from "@/integrations/supabase/client";

export class ValidationSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationSubmissionError";
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
      throw new ValidationSubmissionError(`Failed to submit car listing: ${error.message}`);
    }
    
    // Check for car_id in response
    if (!data?.car_id) {
      throw new ValidationSubmissionError("No car ID returned from submission");
    }
    
    return { id: data.car_id };
  } catch (error) {
    if (error instanceof ValidationSubmissionError) {
      throw error;
    }
    
    console.error("Error in submitCarListing:", error);
    throw new ValidationSubmissionError(`Failed to submit car listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
