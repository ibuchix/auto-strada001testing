
/**
 * Direct Submission Service - Simple approach
 * Created: 2025-05-30 - Phase 5: Direct image upload and database submission
 * Updated: 2025-05-30 - Fixed TypeScript errors for proper database insertion
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
 * Upload a single image to Supabase Storage
 */
const uploadImageToStorage = async (
  file: File, 
  carId: string, 
  photoType: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${photoType}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `cars/${carId}/${fileName}`;
    
    console.log(`Uploading ${photoType} to:`, filePath);
    
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Upload error for ${photoType}:`, error);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    console.log(`Successfully uploaded ${photoType}:`, publicUrl);
    return publicUrl;
  } catch (error) {
    console.error(`Exception uploading ${photoType}:`, error);
    return null;
  }
};

/**
 * Upload all required photos and return URLs
 */
const uploadRequiredPhotos = async (
  requiredPhotos: Record<string, File | string>,
  carId: string
): Promise<Record<string, string>> => {
  const uploadedPhotos: Record<string, string> = {};
  
  for (const [photoType, fileOrUrl] of Object.entries(requiredPhotos)) {
    if (fileOrUrl instanceof File) {
      const url = await uploadImageToStorage(fileOrUrl, carId, photoType);
      if (url) {
        uploadedPhotos[photoType] = url;
      } else {
        console.error(`Failed to upload required photo: ${photoType}`);
      }
    } else if (typeof fileOrUrl === 'string' && fileOrUrl.length > 0) {
      // Already a URL
      uploadedPhotos[photoType] = fileOrUrl;
    }
  }
  
  return uploadedPhotos;
};

/**
 * Upload additional photos and return URLs
 */
const uploadAdditionalPhotos = async (
  additionalPhotos: (File | string)[],
  carId: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  
  for (let i = 0; i < additionalPhotos.length; i++) {
    const photoItem = additionalPhotos[i];
    
    if (photoItem instanceof File) {
      const url = await uploadImageToStorage(photoItem, carId, `additional_${i}`);
      if (url) {
        uploadedUrls.push(url);
      } else {
        console.error(`Failed to upload additional photo ${i}`);
      }
    } else if (typeof photoItem === 'string' && photoItem.length > 0) {
      // Already a URL
      uploadedUrls.push(photoItem);
    }
  }
  
  return uploadedUrls;
};

/**
 * Create car listing with direct upload approach
 */
export const createCarListingDirect = async (
  formData: CarListingFormData,
  userId: string
): Promise<UploadResult> => {
  try {
    const submissionId = uuidv4().slice(0, 8);
    console.log(`[DirectSubmission][${submissionId}] Starting direct submission`);
    
    // Generate car ID first
    const carId = uuidv4();
    
    // Upload images first
    console.log(`[DirectSubmission][${submissionId}] Uploading images for car ${carId}`);
    
    let requiredPhotosUrls: Record<string, string> = {};
    let additionalPhotosUrls: string[] = [];
    
    // Upload required photos if they exist
    if (formData.requiredPhotos && Object.keys(formData.requiredPhotos).length > 0) {
      console.log(`[DirectSubmission][${submissionId}] Uploading ${Object.keys(formData.requiredPhotos).length} required photos`);
      requiredPhotosUrls = await uploadRequiredPhotos(formData.requiredPhotos, carId);
      console.log(`[DirectSubmission][${submissionId}] Required photos uploaded:`, Object.keys(requiredPhotosUrls));
    }
    
    // Upload additional photos if they exist
    if (formData.additionalPhotos && formData.additionalPhotos.length > 0) {
      console.log(`[DirectSubmission][${submissionId}] Uploading ${formData.additionalPhotos.length} additional photos`);
      additionalPhotosUrls = await uploadAdditionalPhotos(formData.additionalPhotos, carId);
      console.log(`[DirectSubmission][${submissionId}] Additional photos uploaded:`, additionalPhotosUrls.length);
    }
    
    // Prepare car data with proper field mapping and type conversion
    const carData = {
      id: carId,
      seller_id: userId,
      seller_name: formData.sellerName || formData.name || '',
      address: formData.address || '',
      mobile_number: formData.mobileNumber || '',
      make: formData.make || '',
      model: formData.model || '',
      year: formData.year || 0,
      mileage: formData.mileage || 0,
      vin: formData.vin || '',
      transmission: formData.transmission || 'manual',
      reserve_price: formData.reservePrice || 0,
      features: formData.features || {},
      is_damaged: formData.isDamaged || false,
      is_registered_in_poland: formData.isRegisteredInPoland || false,
      has_private_plate: formData.hasPrivatePlate || false,
      finance_amount: formData.financeAmount || 0,
      service_history_type: formData.serviceHistoryType || 'none',
      seller_notes: formData.sellerNotes || '',
      seat_material: formData.seatMaterial || 'cloth',
      number_of_keys: typeof formData.numberOfKeys === 'string' ? 
        parseInt(formData.numberOfKeys) || 1 : 
        formData.numberOfKeys || 1, // Ensure it's always a number
      required_photos: requiredPhotosUrls,
      additional_photos: additionalPhotosUrls,
      valuation_data: formData.valuationData || null,
      status: 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log(`[DirectSubmission][${submissionId}] Creating car record with data:`, {
      seller_name: carData.seller_name,
      features: Object.keys(carData.features).length,
      required_photos: Object.keys(carData.required_photos).length,
      additional_photos: carData.additional_photos.length,
      reserve_price: carData.reserve_price,
      number_of_keys: carData.number_of_keys,
      number_of_keys_type: typeof carData.number_of_keys
    });
    
    // Insert car record directly into database
    const { data, error } = await supabase
      .from('cars')
      .insert(carData)
      .select()
      .single();
    
    if (error) {
      console.error(`[DirectSubmission][${submissionId}] Database error:`, error);
      throw new Error(`Database insertion failed: ${error.message}`);
    }
    
    console.log(`[DirectSubmission][${submissionId}] Car created successfully:`, data.id);
    
    return {
      success: true,
      id: carId
    };
    
  } catch (error) {
    console.error('Error in direct submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
