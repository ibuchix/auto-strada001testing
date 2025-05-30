
/**
 * Car Listing Submission Service
 * Updated: 2025-05-30 - Integrated proper image upload handling through Supabase Storage
 * Updated: 2025-05-30 - Fixed property name from valuationData to valuation_data for database compatibility
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
 * Create a car listing with proper image handling
 */
export const createCarListing = async (
  formData: CarListingFormData,
  userId: string
): Promise<CreateListingResult> => {
  try {
    console.log('Creating car listing with image upload handling...');
    
    // Step 1: Process and upload images first
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
    
    console.log('Submission data prepared with image URLs');
    
    // Step 3: Submit to database using edge function
    const { data, error } = await supabase.functions.invoke('create-car-listing', {
      body: {
        valuationData: submissionData.valuation_data, // Use snake_case property name
        userId: userId,
        vin: submissionData.vin,
        mileage: submissionData.mileage,
        transmission: submissionData.transmission,
        carData: submissionData
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
    
    // Step 4: If we have a new car ID and used temp images, re-upload with proper paths
    if (carId && !formData.id) {
      console.log('Re-uploading images with permanent car ID:', carId);
      
      // Re-process images with the new car ID for permanent storage
      if (formData.requiredPhotos) {
        const permanentRequiredPhotos = await processRequiredPhotos(
          formData.requiredPhotos,
          carId
        );
        
        // Update the car record with permanent image URLs
        await supabase
          .from('cars')
          .update({ required_photos: permanentRequiredPhotos })
          .eq('id', carId);
      }
      
      if (formData.additionalPhotos && formData.additionalPhotos.length > 0) {
        const permanentAdditionalPhotos = await processAdditionalPhotos(
          formData.additionalPhotos,
          carId
        );
        
        // Update the car record with permanent image URLs
        await supabase
          .from('cars')
          .update({ additional_photos: permanentAdditionalPhotos })
          .eq('id', carId);
      }
    }
    
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
