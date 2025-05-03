
/**
 * Upload Service for car listing images
 * Created: 2025-07-01
 */

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

/**
 * Uploads multiple images for a car listing
 * @param files Array of files to upload
 * @param carId The ID of the car (or "new" for a new car)
 * @param category The category of images (exterior, interior, damage, etc.)
 * @param userId The user ID of the uploader
 * @returns Array of uploaded file paths
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
    const fileName = `${carId}/${category}/${uuidv4()}.${fileExt}`;
    const filePath = `cars/${userId}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file);
    
    if (error) {
      console.error(`Error uploading ${category} image:`, error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    return filePath;
  });
  
  return await Promise.all(uploadPromises);
};
