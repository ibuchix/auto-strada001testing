
/**
 * Upload Service for Car Listings
 * Created: 2025-05-20
 * Updated: 2025-05-21 - Added direct image association using RLS policies
 * Updated: 2025-05-22 - Fixed TypeScript return type for directUploadPhoto
 * Updated: 2025-05-21 - Fixed bucket name mismatch and improved path structure
 * Updated: 2025-05-23 - Added better error handling for Bucket not found errors
 * Updated: 2025-05-24 - Fixed TypeScript error with StorageError status property
 * Updated: 2025-05-25 - Integrated with centralized storage config
 * Updated: 2025-05-24 - Added comprehensive debug logging and path validation
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STORAGE_BUCKET, STORAGE_PATHS } from "@/config/storage";

/**
 * Sanitizes a string to be safe for use in file paths
 */
const sanitizePath = (input: string): string => {
  if (!input || typeof input !== 'string') {
    console.warn('[UploadService] Invalid input for path sanitization:', input);
    return 'unknown';
  }
  
  // Replace spaces with underscores, remove special characters except dash and underscore
  const sanitized = input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
  
  console.log(`[UploadService] Sanitized "${input}" to "${sanitized}"`);
  return sanitized || 'fallback';
};

/**
 * Validates and sanitizes category name
 */
const validateCategory = (category: string): string => {
  console.log(`[UploadService] Validating category:`, { 
    original: category, 
    type: typeof category, 
    length: category?.length 
  });
  
  if (!category) {
    console.warn('[UploadService] Empty category provided, using fallback');
    return 'additional_photos';
  }
  
  const sanitized = sanitizePath(category);
  console.log(`[UploadService] Category validation complete:`, { 
    original: category, 
    sanitized: sanitized 
  });
  
  return sanitized;
};

/**
 * Validates file name for storage compatibility
 */
const validateFileName = (fileName: string): string => {
  console.log(`[UploadService] Validating file name:`, { 
    original: fileName, 
    type: typeof fileName 
  });
  
  if (!fileName || typeof fileName !== 'string') {
    console.warn('[UploadService] Invalid file name, generating fallback');
    return `${crypto.randomUUID()}.jpg`;
  }
  
  // Extract extension safely
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : 'jpg';
  const baseName = parts.join('.') || 'file';
  
  // Sanitize base name
  const sanitizedBase = sanitizePath(baseName);
  const validatedFileName = `${sanitizedBase}.${extension}`;
  
  console.log(`[UploadService] File name validation complete:`, { 
    original: fileName, 
    validated: validatedFileName 
  });
  
  return validatedFileName;
};

/**
 * Constructs and validates the complete file path
 */
const constructFilePath = (path: string, category: string, fileName: string): string => {
  const validatedCategory = validateCategory(category);
  const validatedFileName = validateFileName(fileName);
  
  let filePath: string;
  
  if (path === "temp") {
    filePath = `${STORAGE_PATHS.TEMP}${validatedCategory}/${validatedFileName}`;
  } else {
    filePath = `${STORAGE_PATHS.CARS}${path}/${validatedCategory}/${validatedFileName}`;
  }
  
  // Remove any double slashes
  filePath = filePath.replace(/\/+/g, '/');
  
  console.log(`[UploadService] Constructed file path:`, { 
    path, 
    category, 
    fileName, 
    validatedCategory, 
    validatedFileName, 
    finalPath: filePath,
    pathComponents: {
      storagePathsTemp: STORAGE_PATHS.TEMP,
      storagePathsCars: STORAGE_PATHS.CARS,
      path: path,
      category: validatedCategory,
      fileName: validatedFileName
    }
  });
  
  // Final validation - check for any remaining invalid characters
  const invalidChars = /[<>:"|?*\x00-\x1f]/;
  if (invalidChars.test(filePath)) {
    console.error('[UploadService] Invalid characters detected in final path:', filePath);
    throw new Error(`Invalid characters in file path: ${filePath}`);
  }
  
  return filePath;
};

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
  const uploadId = crypto.randomUUID();
  console.log(`[UploadService][${uploadId}] Starting direct upload with parameters:`, {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    path: path,
    category: category,
    categoryType: typeof category,
    categoryLength: category?.length,
    storageConfig: {
      bucket: STORAGE_BUCKET,
      tempPath: STORAGE_PATHS.TEMP,
      carsPath: STORAGE_PATHS.CARS
    }
  });
  
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error(`Invalid file type: ${file.type}. Please upload an image file.`);
    }
    
    // Check authentication status
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      throw new Error('User authentication required for file uploads');
    }
    
    console.log(`[UploadService][${uploadId}] Authentication validated`);
    
    // Create unique file path with better structure
    const uniqueId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uniqueId}.${fileExt}`;
    
    console.log(`[UploadService][${uploadId}] Generated file name:`, { 
      originalName: file.name, 
      generatedName: fileName, 
      uniqueId, 
      fileExt 
    });
    
    // Construct and validate the file path
    const filePath = constructFilePath(path, category, fileName);
    
    console.log(`[UploadService][${uploadId}] Final upload parameters:`, {
      bucket: STORAGE_BUCKET,
      filePath: filePath,
      fileSize: file.size,
      fileType: file.type
    });
    
    // Upload to the bucket from config
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`[UploadService][${uploadId}] Upload error:`, {
        error: error,
        errorMessage: error.message,
        filePath: filePath,
        bucket: STORAGE_BUCKET
      });
      
      // More specific error messages based on error message content instead of status code
      if (error.message?.includes('bucket') || error.message?.includes('404')) {
        throw new Error(`Storage bucket error: ${error.message || 'Bucket not found'}. Ensure the ${STORAGE_BUCKET} bucket exists and you have permission to access it.`);
      } else if (error.message?.includes('Permission denied') || error.message?.includes('403')) {
        throw new Error('You do not have permission to upload files. Please sign in again or contact support.');
      } else if (error.message?.includes('pattern')) {
        throw new Error(`Invalid file path format: ${filePath}. Error: ${error.message}`);
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
      }
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData?.publicUrl || '';
    
    console.log(`[UploadService][${uploadId}] Upload successful:`, {
      filePath: filePath,
      publicUrl: publicUrl,
      uploadData: data
    });
    
    // Track this upload in temporary storage
    const uploadInfo = {
      filePath: filePath,
      category: category,
      publicUrl: publicUrl,
      uploadTime: new Date().toISOString(),
      uploadId: uploadId
    };
    
    // Add to temp_car_uploads in localStorage
    const existingUploads = localStorage.getItem('temp_car_uploads');
    const uploads = existingUploads ? JSON.parse(existingUploads) : [];
    uploads.push(uploadInfo);
    localStorage.setItem('temp_car_uploads', JSON.stringify(uploads));
    
    console.log(`[UploadService][${uploadId}] Upload tracked in localStorage`);
    
    // Return just the public URL string
    return publicUrl;
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to upload photo. Please try again.';
    console.error(`[UploadService][${uploadId}] Upload failed:`, {
      error: error,
      errorMessage: errorMessage,
      stack: error.stack,
      fileName: file.name,
      path: path,
      category: category
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
};

export default {
  associateTempUploadsWithCar,
  directUploadPhoto
};
