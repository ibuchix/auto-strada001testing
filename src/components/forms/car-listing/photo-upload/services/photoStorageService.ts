
/**
 * Changes made:
 * - 2024-08-17: Extracted storage operations into a separate service
 */

import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { compressImage } from '../utils/imageCompression';
import { savePhotoToDb } from './photoDbService';

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
    console.log(`Uploading file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
    
    // Compress image if it's too large (> 5MB)
    let fileToUpload = file;
    if (file.size > 5 * 1024 * 1024) {
      fileToUpload = await compressImage(file);
      console.log(`Compressed file size: ${(fileToUpload.size / 1024).toFixed(2)} KB`);
    }

    // Create unique file path with type-based organization
    const fileExt = file.name.split('.').pop();
    const filePath = `${carId}/${category}/${uuidv4()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading image:', error);
      throw new Error(error.message);
    }

    // Construct the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);

    await savePhotoToDb(filePath, carId, category);
    return publicUrl;
  } catch (error: any) {
    console.error('Error during photo upload:', error);
    throw error;
  }
};
