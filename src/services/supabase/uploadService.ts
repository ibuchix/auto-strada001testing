
/**
 * Upload Service for supabase storage
 * Created: 2025-07-10
 * Updated: 2025-07-18 - Fixed file path structure, standardized upload process
 */

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads multiple images for a given entity
 */
export const uploadImagesForCar = async (
  files: File[],
  carId: string,
  category: string,
  userId: string
): Promise<string[]> => {
  if (!files || files.length === 0) return [];
  
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    // Standardized path structure for all car images
    const filePath = `cars/${userId}/${carId}/${category}/${fileName}`;
    
    console.log(`Uploading file to path: ${filePath}`);
    
    const { error, data } = await supabase.storage
      .from('car-images')
      .upload(filePath, file);
    
    if (error) {
      console.error(`Error uploading ${category} image:`, error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    // After successful upload, add record to car_file_uploads table
    const { error: dbError } = await supabase
      .from('car_file_uploads')
      .insert({
        car_id: carId,
        file_path: filePath,
        file_type: file.type,
        upload_status: 'completed',
        category: category,
        image_metadata: {
          size: file.size,
          name: file.name,
          type: file.type,
          originalName: file.name
        }
      });
      
    if (dbError) {
      console.error(`Error recording file upload:`, dbError);
    }
    
    return filePath;
  });
  
  return await Promise.all(uploadPromises);
};

/**
 * Gets the public URL for a file path
 */
export const getPublicUrl = (filePath: string): string => {
  const { data } = supabase.storage
    .from('car-images')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

export default {
  uploadImagesForCar,
  getPublicUrl
};
