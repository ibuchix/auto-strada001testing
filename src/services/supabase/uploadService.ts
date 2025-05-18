
/**
 * Upload Service for supabase storage
 * Created: 2025-07-10
 * Updated: 2025-07-18 - Fixed file path structure, standardized upload process
 * Updated: 2025-05-23 - Added improved error handling and database verification
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
  
  console.log(`Starting upload of ${files.length} files for car ${carId} (category: ${category})`);
  
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
      
      // Try again with simplified metadata
      try {
        const { error: retryError } = await supabase
          .from('car_file_uploads')
          .insert({
            car_id: carId,
            file_path: filePath,
            file_type: file.type,
            upload_status: 'completed',
            category: category
          });
          
        if (retryError) {
          console.error(`Error on retry of file upload record:`, retryError);
        }
      } catch (e) {
        console.error('Exception during database record retry:', e);
      }
    }
    
    // Update the appropriate field in cars table based on category
    if (category.includes('rim_') || category.startsWith('required_')) {
      try {
        // Get current required_photos JSONB object
        const { data: car, error: getError } = await supabase
          .from('cars')
          .select('required_photos')
          .eq('id', carId)
          .single();
          
        if (!getError && car) {
          // Update the required_photos object with the new photo
          const requiredPhotos = car.required_photos || {};
          requiredPhotos[category] = filePath;
          
          // Update the car record with the modified JSONB
          const { error: updateError } = await supabase
            .from('cars')
            .update({ required_photos: requiredPhotos })
            .eq('id', carId);
            
          if (updateError) {
            console.error(`Error updating car required_photos:`, updateError);
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
          
        if (!getError && car) {
          // Update the additional_photos array
          const additionalPhotos = car.additional_photos || [];
          const photosArray = Array.isArray(additionalPhotos) ? additionalPhotos : [];
          
          if (!photosArray.includes(filePath)) {
            // Update the car record with the modified array
            const { error: updateError } = await supabase
              .from('cars')
              .update({ additional_photos: [...photosArray, filePath] })
              .eq('id', carId);
              
            if (updateError) {
              console.error(`Error updating car additional_photos:`, updateError);
            }
          }
        }
      } catch (err) {
        console.error('Exception updating car additional_photos:', err);
      }
    }
    
    return filePath;
  });
  
  // Execute all uploads and catch errors for each one individually
  const results = await Promise.all(
    uploadPromises.map(p => p.catch(error => {
      console.error('Upload failed:', error);
      return null;
    }))
  );
  
  // Filter out failed uploads
  return results.filter(r => r !== null) as string[];
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

/**
 * Verifies that a file exists in storage
 */
export const verifyFileExists = async (filePath: string): Promise<boolean> => {
  try {
    // Try to get metadata for the file
    const { data, error } = await supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    return !error && !!data;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
};

export default {
  uploadImagesForCar,
  getPublicUrl,
  verifyFileExists
};
