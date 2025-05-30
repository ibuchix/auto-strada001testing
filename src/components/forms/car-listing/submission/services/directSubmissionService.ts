
/**
 * Direct Submission Service - Updated to handle car ID extraction properly
 * Updated: 2025-05-30 - Fixed car ID extraction from edge function response
 */

import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface UploadResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Type guard to check if a value is a File object
 */
const isFile = (value: any): value is File => {
  return value instanceof File && typeof value.name === 'string' && typeof value.size === 'number';
};

/**
 * Create car listing using enhanced edge function with image uploads
 */
export const createCarListingDirect = async (
  formData: CarListingFormData,
  userId: string
): Promise<UploadResult> => {
  try {
    const submissionId = uuidv4().slice(0, 8);
    console.log(`[DirectSubmission][${submissionId}] Starting enhanced submission for user: ${userId}`);
    
    // Verify user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Authentication failed - please log in again');
    }
    
    if (session.user.id !== userId) {
      throw new Error('User ID mismatch - please log in again');
    }
    
    // Prepare multipart form data
    const multipartData = new FormData();
    
    // Add car data as JSON string
    const carData = {
      sellerName: formData.sellerName || formData.name || '',
      address: formData.address || '',
      mobileNumber: formData.mobileNumber || '',
      make: formData.make || '',
      model: formData.model || '',
      year: formData.year || 0,
      mileage: formData.mileage || 0,
      vin: formData.vin || '',
      transmission: formData.transmission || 'manual',
      reservePrice: formData.reservePrice || 0,
      features: formData.features || {},
      isDamaged: formData.isDamaged || false,
      isRegisteredInPoland: formData.isRegisteredInPoland || false,
      hasPrivatePlate: formData.hasPrivatePlate || false,
      financeAmount: formData.financeAmount || 0,
      serviceHistoryType: formData.serviceHistoryType || 'none',
      sellerNotes: formData.sellerNotes || '',
      seatMaterial: formData.seatMaterial || 'cloth',
      numberOfKeys: formData.numberOfKeys || 1,
      valuationData: formData.valuationData || null
    };
    
    multipartData.append('carData', JSON.stringify(carData));
    multipartData.append('userId', userId);
    
    // Add required photos - check if they are File objects
    if (formData.requiredPhotos) {
      for (const [photoType, fileOrUrl] of Object.entries(formData.requiredPhotos)) {
        if (fileOrUrl && isFile(fileOrUrl)) {
          multipartData.append(`required_${photoType}`, fileOrUrl);
        }
      }
    }
    
    // Add additional photos - check if they are File objects
    if (formData.additionalPhotos) {
      formData.additionalPhotos.forEach((photoItem, index) => {
        if (photoItem && isFile(photoItem)) {
          multipartData.append(`additional_${index}`, photoItem);
        }
      });
    }
    
    console.log(`[DirectSubmission][${submissionId}] Submitting to enhanced edge function`);
    
    // Submit to enhanced edge function
    const { data, error } = await supabase.functions.invoke('create-car-listing', {
      body: multipartData
    });
    
    if (error) {
      console.error(`[DirectSubmission][${submissionId}] Enhanced edge function error:`, error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create listing';
      if (error.message?.includes('permission denied')) {
        errorMessage = 'Permission denied - please ensure you are logged in as a seller';
      } else if (error.message?.includes('Invalid request body')) {
        errorMessage = 'Invalid form data - please check all required fields';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
    
    if (!data?.success) {
      console.error(`[DirectSubmission][${submissionId}] Listing creation failed:`, data);
      throw new Error(data?.message || 'Failed to create listing - server returned an error');
    }
    
    // Extract car ID with better error handling
    const carId = data.data?.car_id || data.data?.id;
    
    console.log(`[DirectSubmission][${submissionId}] Response data:`, {
      success: data.success,
      dataKeys: data.data ? Object.keys(data.data) : [],
      carId,
      fullResponse: data
    });
    
    if (!carId) {
      console.error(`[DirectSubmission][${submissionId}] No car ID in response:`, data);
      throw new Error('Listing creation succeeded but no car ID was returned. Please check your dashboard to verify the listing was created.');
    }
    
    console.log(`[DirectSubmission][${submissionId}] ✓ Car listing created successfully:`, carId);
    
    return {
      success: true,
      id: carId
    };
    
  } catch (error) {
    console.error('Error in enhanced direct submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
