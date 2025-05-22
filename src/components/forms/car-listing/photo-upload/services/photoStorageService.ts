
/**
 * Service for managing photo storage operations
 * Updated: 2025-05-18 - Added verification and recovery for database records
 * Updated: 2025-07-18 - Fixed path structure and database record creation
 * Updated: 2025-07-19 - Fixed supabase.sql usage with standard methods
 * Updated: 2025-05-23 - Added retry mechanism and enhanced error handling
 * Updated: 2025-05-19 - Removed API route dependency and implemented direct upload
 * Updated: 2025-05-20 - Implemented standardized photo category naming
 * Updated: 2025-05-23 - Improved auth session validation and bucket error handling
 */

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { compressImage } from '../utils/imageCompression';
import { savePhotoToDb, verifyPhotoDbRecord } from './photoDbService';
import { standardizePhotoCategory } from '@/utils/photoMapping';

// Constants
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;
const STORAGE_BUCKET = 'car-images';

/**
 * Uploads a photo to Supabase Storage and saves info to the database
 * @param file The file to upload
 * @param carId The ID of the car
 * @param category The category of the photo
 * @returns A promise that resolves to the public URL of the uploaded file
 */
export const uploadPhoto = async (file: File, carId: string, category: string): Promise<string | null> => {
  let retryCount = 0;
  let lastError: Error | null = null;
  
  // Add detailed logging for debugging
  console.log(`Starting direct upload for file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB, category: ${category}, carId: ${carId}`);
  
  // Standardize the category name for consistent storage path
  const standardCategory = standardizePhotoCategory(category);
  console.log(`Using standardized category: ${standardCategory} (from ${category})`);
  
  while (retryCount <= MAX_RETRIES) {
    try {
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount} of ${MAX_RETRIES} for ${file.name}`);
      }
      
      // Validate inputs
      if (!file) throw new Error('No file provided for upload');
      if (!carId) throw new Error('Car ID is required for photo upload');
      if (!standardCategory) throw new Error('Category is required for photo upload');
      
      // Get user ID from auth session - validate authentication
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('User is not authenticated. Please sign in to upload photos.');
      }
      
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validImageTypes.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Please upload a JPEG, PNG, or WEBP image.`);
      }
      
      // Compress image if it's too large (> 5MB)
      let fileToUpload = file;
      if (file.size > 5 * 1024 * 1024) {
        try {
          fileToUpload = await compressImage(file);
          console.log(`Compressed file size: ${(fileToUpload.size / 1024).toFixed(2)} KB`);
        } catch (compressionError) {
          console.warn('Image compression failed, using original file:', compressionError);
        }
      }

      // Create unique file path with better structure
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${uuidv4()}.${fileExt}`;
      
      // IMPORTANT: Always use 'cars/' prefix in the path
      const filePath = carId === "temp" 
        ? `cars/temp/${standardCategory}/${fileName}` 
        : `cars/${carId}/${standardCategory}/${fileName}`;
      
      console.log(`Direct upload to storage path: ${filePath}, bucket: ${STORAGE_BUCKET}`);
      
      // Direct upload to storage - no API route involved
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error with direct upload:', error);
        
        // Check for specific storage errors
        if (error.message?.includes('bucket') || error.status === 404) {
          throw new Error(`Storage bucket error: ${error.message || 'Bucket not found'}. Please ensure the '${STORAGE_BUCKET}' bucket exists and you have permission to access it.`);
        } else if (error.message?.includes('Permission denied') || error.status === 403) {
          throw new Error('You do not have permission to upload files. Please sign in again.');
        } else {
          throw new Error(`Upload failed: ${error.message || 'Unknown storage error'}`);
        }
      }

      // Construct the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      
      console.log(`File uploaded successfully. Public URL: ${publicUrl}`);

      // Save to database with retry mechanism
      let dbRecordSaved = false;
      let dbRetries = 0;
      
      while (!dbRecordSaved && dbRetries < 3) {
        try {
          // Save to database using standard category
          await savePhotoToDb(filePath, carId, standardCategory);
          
          // Verify the database record was created
          dbRecordSaved = await verifyPhotoDbRecord(filePath, carId);
          
          if (!dbRecordSaved && dbRetries < 2) {
            console.warn(`Database record verification failed for ${filePath}. Retrying...`);
            dbRetries++;
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (dbError) {
          console.error('Database save error:', dbError);
          dbRetries++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!dbRecordSaved) {
        console.error(`Failed to save database record after ${dbRetries} attempts. Image uploaded but not tracked in database.`);
      }
      
      return publicUrl;
    } catch (error: any) {
      lastError = error;
      console.error(`Error during photo upload (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error);
      
      // If we've reached max retries, rethrow the error
      if (retryCount >= MAX_RETRIES) {
        // Convert error to a user-friendly message
        const errorMessage = error.message || 'Failed to upload photo. Please try again.';
        
        // Rethrow with better message
        throw new Error(errorMessage);
      }
      
      // Otherwise, increment retry count and wait before trying again
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  
  // We should never get here due to the throw in the retry loop
  // But just in case, throw the last error we encountered
  if (lastError) {
    throw lastError;
  }
  
  return null;
};

/**
 * Helper function to update car record with image paths
 */
const updateCarRecordWithImage = async (carId: string, filePath: string, category: string): Promise<void> => {
  if (category.startsWith('required_') || category.includes('rim_')) {
    try {
      // Get current required_photos JSONB object
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('required_photos')
        .eq('id', carId)
        .single();
        
      if (getError) {
        console.error('Error fetching car required_photos:', getError);
      } else {
        // Update the required_photos object with the new photo
        const requiredPhotos = car?.required_photos || {};
        requiredPhotos[category] = filePath;
        
        // Update the car record with the modified JSONB
        const { error: updateError } = await supabase
          .from('cars')
          .update({ required_photos: requiredPhotos })
          .eq('id', carId);
          
        if (updateError) {
          console.error('Error updating car required_photos:', updateError);
        }
      }
    } catch (err) {
      console.error('Exception updating car required_photos:', err);
    }
  } else if (category === 'additional_photos') {
    try {
      // Get current additional_photos array
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('additional_photos')
        .eq('id', carId)
        .single();
        
      if (getError) {
        console.error('Error fetching car additional_photos:', getError);
      } else {
        // Update the additional_photos array with the new photo
        let additionalPhotos = car?.additional_photos || [];
        if (!Array.isArray(additionalPhotos)) {
          additionalPhotos = [];
        }
        additionalPhotos.push(filePath);
        
        // Update the car record with the modified array
        const { error: updateError } = await supabase
          .from('cars')
          .update({ additional_photos: additionalPhotos })
          .eq('id', carId);
          
        if (updateError) {
          console.error('Error updating car additional_photos:', updateError);
        }
      }
    } catch (err) {
      console.error('Exception updating car additional_photos:', err);
    }
  }
};

/**
 * Uploads multiple photos in a batch
 */
export const uploadMultiplePhotos = async (
  files: File[],
  carId: string,
  category: string
): Promise<string[]> => {
  console.log(`Starting batch upload of ${files.length} files for category ${category}`);
  const results: string[] = [];
  const errors: Error[] = [];
  
  for (const file of files) {
    try {
      const url = await uploadPhoto(file, carId, category);
      if (url) results.push(url);
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      errors.push(error instanceof Error ? error : new Error(`Unknown error uploading ${file.name}`));
    }
  }
  
  // Log summary
  console.log(`Batch upload complete: ${results.length} successful, ${errors.length} failed`);
  
  // If everything failed, throw an error
  if (errors.length === files.length && files.length > 0) {
    throw new Error(`All ${files.length} uploads failed. Please try again.`);
  }
  
  return results;
};
