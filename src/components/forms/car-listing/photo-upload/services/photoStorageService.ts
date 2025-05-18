
/**
 * Service for managing photo storage operations
 * Updated: 2025-05-18 - Added verification and recovery for database records
 */

import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { compressImage } from '../utils/imageCompression';
import { savePhotoToDb, verifyPhotoDbRecord } from './photoDbService';

/**
 * Uploads a photo to Supabase Storage and saves info to the database
 * @param file The file to upload
 * @param carId The ID of the car
 * @param category The category of the photo
 * @returns A promise that resolves to the public URL of the uploaded file
 */
export const uploadPhoto = async (file: File, carId: string, category: string): Promise<string | null> => {
  try {
    // Show file size for debugging
    console.log(`Uploading file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB for car ${carId}`);
    
    // Validate inputs
    if (!file) throw new Error('No file provided for upload');
    if (!carId) throw new Error('Car ID is required for photo upload');
    if (!category) throw new Error('Category is required for photo upload');
    
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

    // Create unique file path with type-based organization
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${carId}/${category}/${uuidv4()}.${fileExt}`;
    
    console.log(`Uploading to storage path: ${filePath}`);
    
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      
      // Check for specific storage errors
      if (error.message?.includes('unauthorized')) {
        throw new Error('You do not have permission to upload files. Please sign in again.');
      } else if (error.message?.includes('storage quota')) {
        throw new Error('Storage quota exceeded. Please contact support.');
      } else {
        throw new Error(`Upload failed: ${error.message || 'Unknown storage error'}`);
      }
    }

    // Construct the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    console.log(`File uploaded successfully. Public URL: ${publicUrl}`);

    // Save to database with verification
    await savePhotoToDb(filePath, carId, category);
    
    // Double check that the database record was created
    const recordExists = await verifyPhotoDbRecord(filePath, carId);
    if (!recordExists) {
      console.warn(`Database record verification failed for ${filePath}. Attempting recovery...`);
      await savePhotoToDb(filePath, carId, category);
    }
    
    return publicUrl;
  } catch (error: any) {
    console.error('Error during photo upload:', error);
    
    // Convert error to a user-friendly message
    const errorMessage = error.message || 'Failed to upload photo. Please try again.';
    
    // Rethrow with better message
    throw new Error(errorMessage);
  }
};
