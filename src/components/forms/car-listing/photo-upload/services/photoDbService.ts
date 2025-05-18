
/**
 * Service for managing photo database operations
 * Updated: 2025-05-18 - Fixed database recording consistency issues
 * Updated: 2025-07-18 - Added better support for rim photos and standardized categories
 * Updated: 2025-07-19 - Fixed supabase.sql usage with standard methods
 * Updated: 2025-05-23 - Enhanced error handling and recovery capabilities
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
        category: category,
        // Add timestamp for better tracking
        created_at: new Date().toISOString()
      })
      .select();

    if (uploadError) {
      console.error('Error saving to car_file_uploads:', uploadError);
      throw uploadError;
    }

    console.log('Successfully saved to car_file_uploads:', uploadData);

    // For additional photos only, add to the additional_photos array
    if (category === 'additional_photos') {
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

      // Update the additional_photos array with defensive coding
      let currentPhotos = car?.additional_photos;
      
      // Handle all possible data types gracefully
      let photosArray: string[] = [];
      
      if (Array.isArray(currentPhotos)) {
        photosArray = currentPhotos;
      } else if (currentPhotos && typeof currentPhotos === 'object') {
        // Try to convert from JSONB if it's an object
        try {
          photosArray = Object.values(currentPhotos);
        } catch (e) {
          photosArray = [];
        }
      } else if (typeof currentPhotos === 'string') {
        // Handle string case (shouldn't happen but just in case)
        try {
          const parsed = JSON.parse(currentPhotos);
          photosArray = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          photosArray = [currentPhotos];
        }
      }
      
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
    } else if (category.includes('rim_')) {
      // Handle rim photos separately to ensure they're stored correctly
      try {
        // Get current required_photos JSONB object
        const { data: car, error: getError } = await supabase
          .from('cars')
          .select('required_photos')
          .eq('id', carId)
          .single();
          
        if (getError) {
          console.error('Error fetching car required_photos:', getError);
          throw getError;
        }
        
        // Update the required_photos object with the new rim photo
        const requiredPhotos = car?.required_photos || {};
        requiredPhotos[category] = filePath;
        
        // Update the car record with the modified JSONB
        const { error: updateError } = await supabase
          .from('cars')
          .update({ required_photos: requiredPhotos })
          .eq('id', carId);
          
        if (updateError) {
          console.error('Error updating car rim photos:', updateError);
          throw updateError;
        }
        
        console.log('Successfully updated rim photos in required_photos');
      } catch (err) {
        console.error('Exception updating car rim photos:', err);
        throw err;
      }
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
    console.log(`Verifying database record for ${filePath}`);
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
    
    const exists = !!data;
    console.log(`Database record ${exists ? 'exists' : 'does not exist'}`);
    return exists;
  } catch (error) {
    console.error('Exception verifying photo record:', error);
    return false;
  }
};

/**
 * Gets all photos for a car by category
 */
export const getCarPhotosByCategory = async (carId: string, category: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('car_file_uploads')
      .select('file_path')
      .eq('car_id', carId)
      .eq('category', category);
    
    if (error) {
      console.error('Error getting car photos by category:', error);
      return [];
    }
    
    return data?.map(item => item.file_path) || [];
  } catch (error) {
    console.error('Exception getting car photos by category:', error);
    return [];
  }
};

/**
 * Recover missing database records for uploaded photos
 */
export const recoverPhotoRecords = async (carId: string): Promise<number> => {
  try {
    console.log(`Attempting to recover photo records for car ${carId}`);
    
    // First get any required_photos from the car record
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('required_photos, additional_photos')
      .eq('id', carId)
      .single();
      
    if (carError) {
      console.error('Error fetching car data for recovery:', carError);
      return 0;
    }
    
    let recoveredCount = 0;
    const requiredPhotos = car?.required_photos || {};
    const additionalPhotos = car?.additional_photos || [];
    
    // Process required photos
    for (const [category, filePath] of Object.entries(requiredPhotos)) {
      if (typeof filePath === 'string') {
        try {
          // Check if record exists
          const exists = await verifyPhotoDbRecord(filePath, carId);
          
          if (!exists) {
            // Create the missing record
            await supabase
              .from('car_file_uploads')
              .insert({
                car_id: carId,
                file_path: filePath,
                file_type: 'image/jpeg',
                upload_status: 'recovered',
                category: category,
                created_at: new Date().toISOString()
              });
              
            recoveredCount++;
          }
        } catch (e) {
          console.error(`Error recovering required photo for ${category}:`, e);
        }
      }
    }
    
    // Process additional photos
    if (Array.isArray(additionalPhotos)) {
      for (const filePath of additionalPhotos) {
        try {
          // Check if record exists
          const exists = await verifyPhotoDbRecord(filePath, carId);
          
          if (!exists) {
            // Create the missing record
            await supabase
              .from('car_file_uploads')
              .insert({
                car_id: carId,
                file_path: filePath,
                file_type: 'image/jpeg',
                upload_status: 'recovered',
                category: 'additional_photos',
                created_at: new Date().toISOString()
              });
              
            recoveredCount++;
          }
        } catch (e) {
          console.error(`Error recovering additional photo:`, e);
        }
      }
    }
    
    console.log(`Recovery complete: ${recoveredCount} records created`);
    return recoveredCount;
  } catch (error) {
    console.error('Exception during photo record recovery:', error);
    return 0;
  }
};
