
/**
 * Upload Service for supabase storage
 * Created: 2025-07-10
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

export default {
  uploadImagesForCar
};
