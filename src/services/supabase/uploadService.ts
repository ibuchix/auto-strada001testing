
/**
 * Upload Service for Car Listings
 * Created: 2025-05-20
 * Updated: 2025-05-21 - Added direct image association using RLS policies
 * Updated: 2025-05-22 - Fixed TypeScript return type for directUploadPhoto
 * Updated: 2025-05-21 - Fixed bucket name mismatch and improved path structure
 * Updated: 2025-05-23 - Added better error handling for Bucket not found errors
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Associate temporary uploads with a car record using the improved RLS policies
 * @param carId The ID of the car to associate uploads with
 * @returns A promise that resolves to the number of uploads associated
 */
export const associateTempUploadsWithCar = async (carId: string): Promise<number> => {
  try {
    console.log(`[UploadService] Associating temporary uploads with car ${carId}`);
    
    // First try to get temporary uploads from local storage
    const tempUploads = localStorage.getItem('temp_car_uploads');
    if (!tempUploads) {
      console.log(`[UploadService] No temporary uploads found for car ${carId}`);
      return 0;
    }
    
    const uploads = JSON.parse(tempUploads);
    if (!Array.isArray(uploads) || uploads.length === 0) {
      console.log(`[UploadService] Empty or invalid uploads array for car ${carId}`);
      return 0;
    }
    
    console.log(`[UploadService] Found ${uploads.length} temporary uploads to associate`);
    
    // Set the temporary uploads in session variable
    const { error: configError } = await supabase.rpc('set_temp_uploads_data', {
      p_uploads: uploads
    });
    
    if (configError) {
      console.error('[UploadService] Error setting temp uploads data:', configError);
      throw configError;
    }
    
    // Call the security definer function to associate uploads
    const { data, error } = await supabase.rpc('associate_temp_uploads_with_car', {
      p_car_id: carId
    });
    
    if (error) {
      console.error('[UploadService] Error associating uploads:', error);
      throw error;
    }
    
    const count = data || 0;
    console.log(`[UploadService] Successfully associated ${count} uploads with car ${carId}`);
    
    // Clear the temporary uploads from local storage
    localStorage.removeItem('temp_car_uploads');
    
    return count;
  } catch (error) {
    console.error('[UploadService] Error in associateTempUploadsWithCar:', error);
    toast.error('Error associating images with listing');
    return 0;
  }
};

/**
 * Direct upload to storage with improved metadata tracking
 * @param file The file to upload
 * @param path The storage path
 * @param category The photo category
 * @returns A promise that resolves to the public URL of the uploaded file
 */
export const directUploadPhoto = async (
  file: File,
  path: string,
  category: string
): Promise<string> => {
  try {
    console.log(`[UploadService] Starting direct upload for file: ${file.name}, category: ${category}`);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Please upload an image file.`);
    }
    
    // Check if user is authenticated
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('User authentication required for file uploads');
    }
    
    // Create unique file path with better structure
    const uniqueId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uniqueId}.${fileExt}`;
    
    // Use a proper path structure that matches the server-side code
    // IMPORTANT: Use 'car-images' bucket and ensure the path starts with 'cars/'
    const filePath = path === "temp" 
      ? `cars/temp/${category}/${fileName}` 
      : `cars/${path}/${category}/${fileName}`;
    
    console.log(`[UploadService] Uploading to path: ${filePath}, bucket: car-images`);
    
    // Upload to 'car-images' bucket
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('[UploadService] Error uploading file:', error);
      
      // More specific error messages based on error type
      if (error.message?.includes('bucket') || error.status === 404) {
        throw new Error(`Storage bucket error: ${error.message || 'Bucket not found'}. Ensure the car-images bucket exists and you have permission to access it.`);
      } else if (error.message?.includes('Permission denied') || error.status === 403) {
        throw new Error('You do not have permission to upload files. Please sign in again or contact support.');
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData?.publicUrl || '';
    
    console.log(`[UploadService] File uploaded successfully to ${publicUrl}`);
    
    // Track this upload in temporary storage
    const uploadInfo = {
      filePath: filePath,
      category: category,
      publicUrl: publicUrl,
      uploadTime: new Date().toISOString()
    };
    
    // Add to temp_car_uploads in localStorage
    const existingUploads = localStorage.getItem('temp_car_uploads');
    const uploads = existingUploads ? JSON.parse(existingUploads) : [];
    uploads.push(uploadInfo);
    localStorage.setItem('temp_car_uploads', JSON.stringify(uploads));
    
    // Return just the public URL string
    return publicUrl;
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to upload photo. Please try again.';
    console.error('[UploadService] Error uploading photo:', errorMessage, error);
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};

export default {
  associateTempUploadsWithCar,
  directUploadPhoto
};
