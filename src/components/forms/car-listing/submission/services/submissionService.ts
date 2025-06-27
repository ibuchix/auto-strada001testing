
/**
 * Car Listing Submission Service - Option 2 Implementation with Better Error Handling
 * Updated: 2025-06-13 - Added better JSON validation and error logging to prevent parse errors
 */

import { CarListingFormData, CarEntity } from "@/types/forms";
import { prepareSubmission } from "../utils/submission";
import { supabase } from "@/integrations/supabase/client";
import { 
  processRequiredPhotos, 
  processAdditionalPhotos 
} from "@/services/supabase/imageUploadService";
import { uploadTempServiceHistoryFile, uploadTempServiceHistoryFileType } from "@/services/supabase/serviceHistoryFileUploadService";

export interface CreateListingResult {
  success: boolean;
  id?: string;
  error?: string;
  data?: any;
}

/**
 * Validate JSON data before sending to prevent parse errors
 */
const validateJsonData = (data: any): { isValid: boolean; error?: string } => {
  try {
    // Test if the data can be safely stringified and parsed
    const jsonString = JSON.stringify(data);
    JSON.parse(jsonString);
    
    // Check for problematic characters or patterns
    if (jsonString.includes('--') || jsonString.includes('{{') || jsonString.includes('}}')) {
      console.warn('JSON contains potentially problematic characters:', {
        hasDoubleDash: jsonString.includes('--'),
        hasCurlyBraces: jsonString.includes('{{') || jsonString.includes('}}')
      });
    }
    
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'JSON validation failed' 
    };
  }
};

/**
 * Create a car listing with proper image handling - Option 2 Implementation
 * Frontend uploads images, Edge Function accepts JSON with URLs
 */
export const createCarListing = async (
  formData: CarListingFormData,
  userId: string
): Promise<CreateListingResult> => {
  try {
    console.log('Creating car listing - Option 2 with selective transformation');
    
    // Step 1: Process and upload images first (frontend handles this)
    let processedRequiredPhotos: Record<string, string> = {};
    let processedAdditionalPhotos: string[] = [];
    let storedTempServiceFileData: uploadTempServiceHistoryFileType | null;
    
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

    /* process and upload service history file to a temp storagge 'car-file/services-history/temp' and return the public url */
    if(formData.serviceHistoryFiles && formData.serviceHistoryFiles instanceof File){
      console.log("Uploading service history document to temp dir.")
      storedTempServiceFileData = await uploadTempServiceHistoryFile(formData.serviceHistoryFiles);
    }
    
    // Step 2: Prepare submission data with uploaded image URLs using selective transformation
    const submissionData = prepareSubmission({
      ...formData,
      requiredPhotos: processedRequiredPhotos,
      additionalPhotos: processedAdditionalPhotos,  
      serviceHistoryFiles: storedTempServiceFileData
    });
    
    console.log('Submission data prepared with selective transformation:', {
      requiredPhotosCount: Object.keys(processedRequiredPhotos).length,
      additionalPhotosCount: processedAdditionalPhotos.length,
      hasReservePrice: !!submissionData.reserve_price,
      transformationType: 'selective'
    });
    
    // Step 3: Validate JSON data before sending
    const validation = validateJsonData({
      carData: submissionData,
      userId: userId
    });
    
    if (!validation.isValid) {
      console.error('JSON validation failed:', validation.error);
      throw new Error(`Invalid JSON data: ${validation.error}`);
    }
    
    console.log('JSON validation passed, sending to Edge Function');
    
    // Step 4: Submit to database using simplified edge function with validated JSON
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
