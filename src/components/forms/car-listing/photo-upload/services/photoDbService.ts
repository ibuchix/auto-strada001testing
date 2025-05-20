
/**
 * Service for managing photo database operations
 * Created: 2025-05-19 - Added as part of upload refactoring
 * Updated: 2025-05-20 - Fixed updateCarRecordWithImage to properly handle required_photos
 * Updated: 2025-05-27 - Fixed TypeScript error by selecting both required_photos and additional_photos
 * Updated: 2025-05-20 - Enhanced with standardized photo category naming
 * Updated: 2025-05-20 - Updated to use the dedicated category column
 */

import { supabase } from '@/integrations/supabase/client';
import { standardizePhotoCategory, REQUIRED_PHOTO_FIELDS } from '@/utils/photoMapping';

/**
 * Saves information about an uploaded photo to the database
 * @param filePath The path of the uploaded file
 * @param carId The ID of the car the photo belongs to
 * @param category The category of the photo
 */
export const savePhotoToDb = async (filePath: string, carId: string, category: string): Promise<void> => {
  console.log(`Recording file in database: ${filePath}`);
  
  try {
    // Standardize category name for consistent storage
    const standardCategory = standardizePhotoCategory(category);
    
    const { error } = await supabase
      .from('car_file_uploads')
      .insert({
        car_id: carId,
        file_path: filePath,
        file_type: getFileTypeFromPath(filePath),
        upload_status: 'completed',
        category: standardCategory, // Use the new dedicated column
        image_metadata: {
          size: filePath.length,
          name: filePath.split('/').pop(),
          type: getFileTypeFromPath(filePath)
        }
      });
    
    if (error) {
      console.error('Error saving photo to database:', error);
      throw error;
    }
    
    // Also update the car record with the image
    await updateCarRecordWithImage(carId, filePath, standardCategory);
  } catch (error) {
    console.error('Exception saving photo to database:', error);
    throw error;
  }
};

/**
 * Verifies that a photo record exists in the database
 * @param filePath The path of the file to verify
 * @param carId The ID of the car the photo belongs to
 */
export const verifyPhotoDbRecord = async (filePath: string, carId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('car_file_uploads')
      .select('id')
      .eq('car_id', carId)
      .eq('file_path', filePath)
      .limit(1);
    
    if (error) {
      console.error('Error verifying photo record:', error);
      return false;
    }
    
    return data !== null && data.length > 0;
  } catch (error) {
    console.error('Exception verifying photo record:', error);
    return false;
  }
};

/**
 * Recovers orphaned photo records by checking storage against database
 * @param carId The ID of the car to recover records for
 */
export const recoverPhotoRecords = async (carId: string): Promise<number> => {
  try {
    // Get user ID from session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId || !carId) {
      return 0;
    }
    
    console.log(`Attempting to recover photo records for car ${carId}`);
    
    // List all files in the car's folder
    const folderPath = `cars/${userId}/${carId}`;
    const { data: folders, error: folderError } = await supabase.storage
      .from('car-images')
      .list(folderPath);
      
    if (folderError || !folders || folders.length === 0) {
      console.log('No folders to recover or error listing folders:', folderError);
      return 0;
    }
    
    let recoveredCount = 0;
    
    // Check each category folder
    for (const folder of folders) {
      if (!folder.name || folder.id) continue; // Skip files, only process folders
      
      const categoryPath = `${folderPath}/${folder.name}`;
      const { data: files, error: filesError } = await supabase.storage
        .from('car-images')
        .list(categoryPath);
        
      if (filesError || !files) continue;
      
      for (const file of files) {
        if (file.id) continue; // Skip folders
        
        const filePath = `${categoryPath}/${file.name}`;
        
        // Check if file record exists in database
        const { data, error } = await supabase
          .from('car_file_uploads')
          .select('id')
          .eq('car_id', carId)
          .eq('file_path', filePath)
          .limit(1);
          
        // If record doesn't exist, create it
        if (!error && (!data || data.length === 0)) {
          const { error: insertError } = await supabase
            .from('car_file_uploads')
            .insert({
              car_id: carId,
              file_path: filePath,
              file_type: getFileTypeFromPath(file.name),
              upload_status: 'completed',
              category: folder.name
            });
            
          if (!insertError) {
            recoveredCount++;
            
            // Also update the car record
            await updateCarRecordWithImage(carId, filePath, folder.name);
          }
        }
      }
    }
    
    console.log(`Recovered ${recoveredCount} photo records for car ${carId}`);
    return recoveredCount;
  } catch (error) {
    console.error('Error recovering photo records:', error);
    return 0;
  }
};

/**
 * Updates the car record with the image path
 * Uses standardized naming to ensure consistent field mapping
 */
const updateCarRecordWithImage = async (carId: string, filePath: string, category: string): Promise<void> => {
  try {
    // Standardize the category to ensure consistent field naming
    const standardCategory = standardizePhotoCategory(category);
    
    // Get current car record
    const { data: car, error: getError } = await supabase
      .from('cars')
      .select('required_photos, additional_photos')
      .eq('id', carId)
      .single();
      
    if (getError) {
      console.error('Error getting car record:', getError);
      return;
    }
    
    // Handle all category types - determine if this is a required or additional photo
    if (standardCategory === 'additional_photos' || standardCategory.includes('additional')) {
      // Handle additional photos as an array
      // Get current additional_photos array
      const additionalPhotos = car?.additional_photos || [];
      
      if (!Array.isArray(additionalPhotos)) {
        // Update with a new array containing this photo
        const { error: updateError } = await supabase
          .from('cars')
          .update({ additional_photos: [filePath] })
          .eq('id', carId);
          
        if (updateError) {
          console.error('Error updating car record with additional photos:', updateError);
        }
      } else if (!additionalPhotos.includes(filePath)) {
        // Add to existing array
        additionalPhotos.push(filePath);
        
        // Update the car record with the modified array
        const { error: updateError } = await supabase
          .from('cars')
          .update({ additional_photos: additionalPhotos })
          .eq('id', carId);
          
        if (updateError) {
          console.error('Error updating car record with additional photos:', updateError);
        }
      }
    } else {
      // This is a required photo - handle as part of the required_photos JSONB object
      
      // Get current required_photos JSONB object
      const requiredPhotos = car?.required_photos || {};
      
      // Update the required_photos object with the new photo
      requiredPhotos[standardCategory] = filePath;
      
      console.log(`Updating car ${carId} with ${standardCategory} photo: ${filePath}`);
      
      // Update the car record with the modified JSONB
      const { error: updateError } = await supabase
        .from('cars')
        .update({ required_photos: requiredPhotos })
        .eq('id', carId);
        
      if (updateError) {
        console.error('Error updating car record with required photos:', updateError);
      }
    }
  } catch (error) {
    console.error('Error updating car record with image:', error);
  }
};

/**
 * Helper function to get file type from file path
 */
const getFileTypeFromPath = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};
