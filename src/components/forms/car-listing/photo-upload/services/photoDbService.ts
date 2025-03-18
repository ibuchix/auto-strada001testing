
/**
 * Changes made:
 * - 2024-08-17: Extracted database operations into a separate service
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Saves the photo information to the database
 * @param filePath The path of the uploaded file
 * @param carId The ID of the car
 * @param category The category of the photo
 * @returns A promise that resolves to the file path
 */
export const savePhotoToDb = async (filePath: string, carId: string, category: string): Promise<string> => {
  try {
    // Insert into car_file_uploads table for tracking
    const { error: uploadError } = await supabase
      .from('car_file_uploads')
      .insert({
        car_id: carId,
        file_path: filePath,
        file_type: 'image/jpeg',
        upload_status: 'completed',
        category: category
      });

    if (uploadError) throw uploadError;

    // Get current additional_photos from car
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('additional_photos')
      .eq('id', carId)
      .single();

    if (carError) throw carError;

    // Update the additional_photos array
    const currentPhotos = car.additional_photos || [];
    
    // Convert to array if JSON is not an array
    const photosArray = Array.isArray(currentPhotos) ? currentPhotos : [];
    const newPhotos = [...photosArray, filePath];

    // Update the car record
    const { error: updateError } = await supabase
      .from('cars')
      .update({ additional_photos: newPhotos })
      .eq('id', carId);

    if (updateError) throw updateError;

    return filePath;
  } catch (error) {
    console.error('Error saving photo to database:', error);
    throw error;
  }
};
