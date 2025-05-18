
/**
 * Service for managing photo database operations
 * Updated: 2025-05-18 - Fixed database recording consistency issues
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
    console.log(`Saving photo to database: ${filePath} for car ${carId} (category: ${category})`);
    
    // Insert into car_file_uploads table for tracking with double-check
    const { data: uploadData, error: uploadError } = await supabase
      .from('car_file_uploads')
      .insert({
        car_id: carId,
        file_path: filePath,
        file_type: 'image/jpeg',
        upload_status: 'completed',
        category: category
      })
      .select();

    if (uploadError) {
      console.error('Error saving to car_file_uploads:', uploadError);
      throw uploadError;
    }

    console.log('Successfully saved to car_file_uploads:', uploadData);

    // Get current additional_photos from car
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('additional_photos')
      .eq('id', carId)
      .single();

    if (carError) {
      console.error('Error fetching car data:', carError);
      throw carError;
    }

    // Update the additional_photos array
    const currentPhotos = car.additional_photos || [];
    
    // Convert to array if JSON is not an array
    const photosArray = Array.isArray(currentPhotos) ? currentPhotos : [];
    
    // Avoid duplicates
    if (!photosArray.includes(filePath)) {
      const newPhotos = [...photosArray, filePath];

      // Update the car record
      const { data: updateData, error: updateError } = await supabase
        .from('cars')
        .update({ additional_photos: newPhotos })
        .eq('id', carId)
        .select();

      if (updateError) {
        console.error('Error updating car additional_photos:', updateError);
        throw updateError;
      }
      
      console.log('Successfully updated car additional_photos:', updateData);
    } else {
      console.log(`Skipping duplicate entry for ${filePath}`);
    }

    return filePath;
  } catch (error) {
    console.error('Error saving photo to database:', error);
    throw error;
  }
};

/**
 * Verify if the car_file_uploads record exists for a given file path
 * @param filePath The path of the uploaded file
 * @param carId The ID of the car
 * @returns A promise that resolves to a boolean indicating if the record exists
 */
export const verifyPhotoDbRecord = async (filePath: string, carId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('car_file_uploads')
      .select('id')
      .eq('car_id', carId)
      .eq('file_path', filePath)
      .maybeSingle();
    
    if (error) {
      console.error('Error verifying photo record:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Exception verifying photo record:', error);
    return false;
  }
};
