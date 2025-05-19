/**
 * Upload Service for supabase storage
 * Created: 2025-07-10
 * Updated: 2025-07-18 - Fixed file path structure, standardized upload process
 * Updated: 2025-05-23 - Added improved error handling and database verification
 * Updated: 2025-05-24 - Fixed file existence verification method
 * Updated: 2025-05-19 - Fixed direct storage upload implementation, removed API dependency
 * Updated: 2025-05-20 - Enhanced direct upload with improved temp ID handling
 * Updated: 2025-05-21 - Fixed temporary file tracking and association
 * Updated: 2025-05-24 - Enhanced immediate upload flow with better error handling
 */

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "@/components/forms/car-listing/photo-upload/utils/imageCompression";

// Define types for temporary file tracking
interface TempFileMetadata {
  filePath: string;
  publicUrl: string;
  category: string; 
  uploadId: string;
  timestamp: string;
}

// Consistent temp ID for a session
const getSessionTempId = (): string => {
  let tempId = localStorage.getItem('tempSessionId');
  if (!tempId) {
    tempId = `temp_${uuidv4()}`;
    localStorage.setItem('tempSessionId', tempId);
    console.log(`Created new session temp ID: ${tempId}`);
  }
  return tempId;
};

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
  
  console.log(`Starting direct upload of ${files.length} files for car ${carId} (category: ${category})`);
  
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    // Standardized path structure for all car images
    const filePath = `cars/${userId}/${carId}/${category}/${fileName}`;
    
    console.log(`Uploading file to path: ${filePath}`);
    
    try {
      // Direct upload to Supabase storage - no API involved
      const { error, data } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
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
        console.warn(`Warning: Could not record file upload to database:`, dbError);
      }
      
      // Update the appropriate field in cars table based on category
      await updateCarRecordWithImage(carId, filePath, category);
      
      return filePath;
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      return null;
    }
  });
  
  // Execute all uploads and catch errors for each one individually
  const results = await Promise.all(uploadPromises);
  
  // Filter out failed uploads
  const successfulUploads = results.filter(r => r !== null) as string[];
  
  console.log(`Direct upload completed: ${successfulUploads.length} successful, ${results.length - successfulUploads.length} failed`);
  
  return successfulUploads;
};

/**
 * Helper function to update car record with image paths
 */
const updateCarRecordWithImage = async (carId: string, filePath: string, category: string): Promise<void> => {
  try {
    if (category.includes('rim_') || category.startsWith('required_')) {
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
        await supabase
          .from('cars')
          .update({ required_photos: requiredPhotos })
          .eq('id', carId);
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
            await supabase
              .from('cars')
              .update({ additional_photos: [...photosArray, filePath] })
              .eq('id', carId);
          }
        }
      } catch (err) {
        console.error('Exception updating car additional_photos:', err);
      }
    }
  } catch (error) {
    console.error('Error updating car record with image:', error);
  }
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
 * Directly uploads a single photo to Supabase Storage
 * Uses a session-consistent temporary ID if no car ID is available yet
 */
export const directUploadPhoto = async (
  file: File,
  carId: string = "temp",
  category: string = 'additional_photos'
): Promise<string | null> => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Compress the image if it's large (over 5MB)
    let fileToUpload = file;
    if (file.size > 5 * 1024 * 1024) {
      try {
        fileToUpload = await compressImage(file);
        console.log(`Compressed image from ${(file.size / 1024).toFixed(2)}KB to ${(fileToUpload.size / 1024).toFixed(2)}KB`);
      } catch (compressionError) {
        console.warn('Image compression failed, using original file:', compressionError);
      }
    }
    
    // Get user ID from session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id || "anonymous";
    
    // Generate a consistent temporary ID for this session if working with a draft
    const uploadId = carId === "temp" ? getSessionTempId() : carId;
    
    console.log(`Directly uploading file ${file.name} for ${carId === "temp" ? "temporary" : "existing"} car (${uploadId}), category: ${category}`);
    
    // Create unique file path using consistent structure
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `cars/${userId}/${uploadId}/${category}/${fileName}`;
    
    // Upload to storage directly with better error handling and retry capability
    try {
      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error with direct upload:', uploadError);
        throw uploadError;
      }
    } catch (uploadError) {
      // Add retry logic for common network errors
      if (uploadError instanceof Error && 
          (uploadError.message.includes('network') || 
           uploadError.message.includes('timeout'))) {
        // Wait a moment and try once more
        console.log('Network error during upload, retrying once...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: retryError } = await supabase.storage
          .from('car-images')
          .upload(filePath, fileToUpload, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (retryError) {
          console.error('Error with retry upload:', retryError);
          throw retryError;
        }
      } else {
        // For other errors, just throw
        throw uploadError;
      }
    }
    
    console.log(`Direct upload successful: ${filePath}`);
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    // Only attempt to update database records for non-temp uploads
    if (carId !== "temp") {
      // Record in database
      try {
        await supabase
          .from('car_file_uploads')
          .insert({
            car_id: carId,
            file_path: filePath,
            file_type: file.type,
            upload_status: 'completed',
            category: category,
            image_metadata: {
              size: fileToUpload.size,
              name: file.name
            }
          });
          
        // Update car record
        await updateCarRecordWithImage(carId, filePath, category);
      } catch (dbError) {
        console.warn('Warning: Could not record file in database:', dbError);
        // Continue anyway as the file is uploaded
      }
    } else {
      // For temporary uploads, store metadata in localStorage for later association
      try {
        const tempUploads: TempFileMetadata[] = JSON.parse(localStorage.getItem('tempFileUploads') || '[]');
        
        const newUpload: TempFileMetadata = {
          filePath,
          publicUrl,
          category,
          uploadId,
          timestamp: new Date().toISOString()
        };
        
        tempUploads.push(newUpload);
        localStorage.setItem('tempFileUploads', JSON.stringify(tempUploads));
        console.log(`Stored temp upload metadata for future association: ${filePath}`);
      } catch (e) {
        console.warn('Could not store temp upload metadata:', e);
      }
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Direct upload failed:', error);
    return null;
  }
};

/**
 * Associates temporary uploads with a car ID after the car is created
 */
export const associateTempUploadsWithCar = async (carId: string): Promise<number> => {
  try {
    if (!carId) {
      console.error('Cannot associate uploads: No car ID provided');
      return 0;
    }

    // Get user ID from session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    if (!userId) {
      console.error('Cannot associate uploads: No user ID available');
      return 0;
    }

    // Retrieve temp uploads from localStorage
    const tempUploadsStr = localStorage.getItem('tempFileUploads');
    if (!tempUploadsStr) {
      console.log('No temporary uploads found to associate');
      return 0;
    }
    
    // Get the temp session ID
    const tempSessionId = localStorage.getItem('tempSessionId');
    if (!tempSessionId) {
      console.log('No temp session ID found, cannot associate uploads');
      return 0;
    }
    
    console.log(`Associating temp uploads for session ${tempSessionId} with car ID ${carId}`);
    
    const tempUploads: TempFileMetadata[] = JSON.parse(tempUploadsStr);
    let associatedCount = 0;
    
    for (const upload of tempUploads) {
      try {
        console.log(`Processing upload association for ${upload.filePath} in category ${upload.category}`);
        
        // Record in database
        await supabase
          .from('car_file_uploads')
          .insert({
            car_id: carId,
            file_path: upload.filePath,
            file_type: 'image/jpeg', // Default if not available
            upload_status: 'completed',
            category: upload.category,
            image_metadata: {
              url: upload.publicUrl
            }
          });
          
        // Update car record
        await updateCarRecordWithImage(carId, upload.filePath, upload.category);
        associatedCount++;
      } catch (error) {
        console.error(`Error associating upload ${upload.filePath} with car ${carId}:`, error);
      }
    }
    
    // Clear processed uploads
    if (associatedCount > 0) {
      localStorage.removeItem('tempFileUploads');
      localStorage.removeItem('tempSessionId');
      console.log(`Associated ${associatedCount} temporary uploads with car ${carId}`);
    }
    
    return associatedCount;
  } catch (error) {
    console.error('Error associating temporary uploads:', error);
    return 0;
  }
};

export default {
  uploadImagesForCar,
  getPublicUrl,
  directUploadPhoto,
  associateTempUploadsWithCar
};
