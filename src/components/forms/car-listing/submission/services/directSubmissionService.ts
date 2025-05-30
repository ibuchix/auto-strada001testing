
/**
 * Direct Submission Service - Updated to use enhanced edge function
 * Updated: 2025-05-30 - Fixed TypeScript errors and improved file type checking
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
      console.error('Enhanced edge function error:', error);
      throw new Error(error.message || 'Failed to create listing');
    }
    
    if (!data?.success) {
      console.error('Listing creation failed:', data);
      throw new Error(data?.message || 'Failed to create listing');
    }
    
    const carId = data.data?.car_id || data.data?.id;
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
