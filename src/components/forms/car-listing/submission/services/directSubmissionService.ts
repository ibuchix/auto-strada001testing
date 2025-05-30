
/**
 * Direct Submission Service - Simple approach
 * Created: 2025-05-30 - Phase 5: Direct image upload and database submission
 * Updated: 2025-05-30 - Fixed authentication context and added security definer function fallback
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
 * Verify authentication and refresh session if needed
 */
const ensureAuthentication = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return false;
    }
    
    if (!session) {
      console.error('No active session found');
      return false;
    }
    
    // Check if session is about to expire (within 5 minutes)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;
    
    if (timeUntilExpiry < 300) { // 5 minutes
      console.log('Session expiring soon, refreshing...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession) {
        console.error('Failed to refresh session:', refreshError);
        return false;
      }
      
      console.log('Session refreshed successfully');
    }
    
    console.log('Authentication verified, user ID:', session.user.id);
    return true;
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return false;
  }
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
    console.log(`[DirectSubmission][${submissionId}] Starting direct submission for user: ${userId}`);
    
    // Verify authentication before proceeding
    const isAuthenticated = await ensureAuthentication();
    if (!isAuthenticated) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    
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
    
    // Prepare car data for the security definer function
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
        formData.numberOfKeys || 1,
      required_photos: requiredPhotosUrls,
      additional_photos: additionalPhotosUrls,
      valuation_data: formData.valuationData || null,
      status: 'available'
    };
    
    console.log(`[DirectSubmission][${submissionId}] Creating car record with security definer function`);
    
    // Use the security definer function to bypass RLS issues
    const { data, error } = await supabase.rpc('create_car_listing', {
      p_car_data: carData,
      p_user_id: userId
    });
    
    if (error) {
      console.error(`[DirectSubmission][${submissionId}] Security definer function error:`, error);
      
      // If the function fails, try direct insertion as fallback
      console.log(`[DirectSubmission][${submissionId}] Falling back to direct insertion`);
      
      const { data: directData, error: directError } = await supabase
        .from('cars')
        .insert({
          ...carData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (directError) {
        console.error(`[DirectSubmission][${submissionId}] Direct insertion also failed:`, directError);
        throw new Error(`Both submission methods failed. Last error: ${directError.message}`);
      }
      
      console.log(`[DirectSubmission][${submissionId}] Direct insertion successful:`, directData.id);
    } else {
      console.log(`[DirectSubmission][${submissionId}] Security definer function successful`);
    }
    
    console.log(`[DirectSubmission][${submissionId}] Car created successfully:`, carId);
    
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
