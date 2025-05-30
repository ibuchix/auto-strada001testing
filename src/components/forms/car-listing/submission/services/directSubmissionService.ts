
/**
 * Direct Submission Service - Prioritizing direct INSERT for verified sellers
 * Created: 2025-05-30 - Phase 5: Direct image upload and database submission
 * Updated: 2025-05-30 - Prioritized direct INSERT and improved authentication handling
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
      uploadedUrls.push(photoItem);
    }
  }
  
  return uploadedUrls;
};

/**
 * Comprehensive authentication and seller verification
 */
const verifySellerAuthentication = async (userId: string): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // Step 1: Verify session is active and valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { isValid: false, error: 'Session validation failed' };
    }
    
    if (!session || !session.user) {
      return { isValid: false, error: 'No active session found' };
    }
    
    if (session.user.id !== userId) {
      return { isValid: false, error: 'User ID mismatch' };
    }
    
    // Step 2: Check seller status using the RPC function
    const { data: isSellerData, error: isSellerError } = await supabase.rpc('is_verified_seller', {
      p_user_id: userId
    });
    
    if (isSellerError) {
      console.error('Seller verification RPC error:', isSellerError);
      return { isValid: false, error: 'Seller verification failed' };
    }
    
    if (!isSellerData) {
      return { isValid: false, error: 'User is not a verified seller' };
    }
    
    // Step 3: Double-check with direct query to sellers table
    const { data: sellerData, error: sellerError } = await supabase
      .from('sellers')
      .select('id, is_verified, verification_status')
      .eq('user_id', userId)
      .single();
    
    if (sellerError || !sellerData) {
      console.error('Direct seller check failed:', sellerError);
      return { isValid: false, error: 'Seller record not found' };
    }
    
    if (!sellerData.is_verified || sellerData.verification_status !== 'verified') {
      return { isValid: false, error: 'Seller is not verified' };
    }
    
    console.log('✓ Authentication and seller verification successful:', {
      userId,
      sellerId: sellerData.id,
      isVerified: sellerData.is_verified
    });
    
    return { isValid: true };
    
  } catch (error) {
    console.error('Error in seller authentication verification:', error);
    return { isValid: false, error: 'Authentication verification failed' };
  }
};

/**
 * Direct INSERT approach for verified sellers
 */
const directInsertCar = async (carData: any, userId: string): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    console.log('Attempting direct INSERT to cars table');
    
    const { data, error } = await supabase
      .from('cars')
      .insert({
        ...carData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Direct INSERT error:', error);
      return { 
        success: false, 
        error: `Direct INSERT failed: ${error.message}` 
      };
    }
    
    console.log('✓ Direct INSERT successful:', data.id);
    return { 
      success: true, 
      id: data.id 
    };
    
  } catch (error) {
    console.error('Exception in direct INSERT:', error);
    return { 
      success: false, 
      error: `Direct INSERT exception: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Security definer function as fallback
 */
const securityDefinerInsert = async (carData: any, userId: string): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    console.log('Attempting security definer function as fallback');
    
    const { data, error } = await supabase.rpc('create_car_listing', {
      p_car_data: carData,
      p_user_id: userId
    });
    
    if (error) {
      console.error('Security definer function error:', error);
      return { 
        success: false, 
        error: `Security definer failed: ${error.message}` 
      };
    }
    
    console.log('✓ Security definer function successful');
    return { 
      success: true, 
      id: carData.id 
    };
    
  } catch (error) {
    console.error('Exception in security definer function:', error);
    return { 
      success: false, 
      error: `Security definer exception: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

/**
 * Create car listing with improved direct approach
 */
export const createCarListingDirect = async (
  formData: CarListingFormData,
  userId: string
): Promise<UploadResult> => {
  try {
    const submissionId = uuidv4().slice(0, 8);
    console.log(`[DirectSubmission][${submissionId}] Starting improved direct submission for user: ${userId}`);
    
    // Step 1: Comprehensive authentication and seller verification
    const authResult = await verifySellerAuthentication(userId);
    if (!authResult.isValid) {
      throw new Error(authResult.error || 'Authentication failed');
    }
    
    // Step 2: Generate car ID and upload images
    const carId = uuidv4();
    console.log(`[DirectSubmission][${submissionId}] Generated car ID: ${carId}`);
    
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
    
    // Step 3: Prepare car data
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
    
    console.log(`[DirectSubmission][${submissionId}] Car data prepared, attempting direct INSERT`);
    
    // Step 4: Try direct INSERT first (primary method)
    const directResult = await directInsertCar(carData, userId);
    
    if (directResult.success) {
      console.log(`[DirectSubmission][${submissionId}] ✓ Direct INSERT successful`);
      return {
        success: true,
        id: carId
      };
    }
    
    console.warn(`[DirectSubmission][${submissionId}] Direct INSERT failed, trying security definer fallback`);
    console.warn(`[DirectSubmission][${submissionId}] Direct INSERT error:`, directResult.error);
    
    // Step 5: Fallback to security definer function
    const fallbackResult = await securityDefinerInsert(carData, userId);
    
    if (fallbackResult.success) {
      console.log(`[DirectSubmission][${submissionId}] ✓ Security definer fallback successful`);
      return {
        success: true,
        id: carId
      };
    }
    
    // Both methods failed
    console.error(`[DirectSubmission][${submissionId}] Both direct INSERT and security definer failed`);
    throw new Error(`All submission methods failed. Direct: ${directResult.error}, Fallback: ${fallbackResult.error}`);
    
  } catch (error) {
    console.error('Error in improved direct submission:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
