
/**
 * Car Listing Submission Service - Option 2 Implementation
 * Updated: 2025-06-13 - Simplified to work with Edge Function that accepts JSON with image URLs
 */

import { CarListingFormData, CarEntity } from "@/types/forms";
import { prepareSubmission } from "../utils/submission";
import { supabase } from "@/integrations/supabase/client";
import { 
  processRequiredPhotos, 
  processAdditionalPhotos 
} from "@/services/supabase/imageUploadService";

export interface CreateListingResult {
  success: boolean;
  id?: string;
  error?: string;
  data?: any;
}

/**
 * Create a car listing with proper image handling - Option 2 Implementation
 * Frontend uploads images, Edge Function accepts JSON with URLs
 */
export const createCarListing = async (
  formData: CarListingFormData,
  userId: string
): Promise<CreateListingResult> => {
  try {
    console.log('Creating car listing - Option 2: Frontend uploads, Edge Function accepts URLs');
    
    // Step 1: Process and upload images first (frontend handles this)
    let processedRequiredPhotos: Record<string, string> = {};
    let processedAdditionalPhotos: string[] = [];
    
    if (formData.requiredPhotos) {
      console.log('Processing required photos...');
      processedRequiredPhotos = await processRequiredPhotos(
        formData.requiredPhotos,
        formData.id // Use existing car ID if updating
      );
      console.log('Required photos processed:', Object.keys(processedRequiredPhotos));
    }
    
    if (formData.additionalPhotos && formData.additionalPhotos.length > 0) {
      console.log('Processing additional photos...');
      processedAdditionalPhotos = await processAdditionalPhotos(
        formData.additionalPhotos,
        formData.id // Use existing car ID if updating
      );
      console.log('Additional photos processed:', processedAdditionalPhotos.length);
    }
    
    // Step 2: Prepare submission data with uploaded image URLs
    const submissionData = prepareSubmission({
      ...formData,
      requiredPhotos: processedRequiredPhotos,
      additionalPhotos: processedAdditionalPhotos
    });
    
    console.log('Submission data prepared with image URLs:', {
      requiredPhotosCount: Object.keys(processedRequiredPhotos).length,
      additionalPhotosCount: processedAdditionalPhotos.length
    });
    
    // Step 3: Submit to database using simplified edge function with JSON
    const { data, error } = await supabase.functions.invoke('create-car-listing', {
      body: {
        carData: submissionData,
        userId: userId
      }
    });
    
    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to create listing');
    }
    
    if (!data?.success) {
      console.error('Listing creation failed:', data);
      throw new Error(data?.message || 'Failed to create listing');
    }
    
    const carId = data.data?.car_id || data.data?.id;
    
    console.log('Car listing created successfully:', carId);
    
    return {
      success: true,
      id: carId,
      data: data.data
    };
    
  } catch (error) {
    console.error('Error creating car listing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
