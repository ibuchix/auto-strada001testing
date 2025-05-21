
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
 * Updated: 2025-05-26 - Improved temp file tracking in localStorage with proper consistency checks
 * Updated: 2025-05-20 - Updated to use the dedicated category column in car_file_uploads
 * Updated: 2025-06-15 - Updated to work with improved RLS policies for image association
 * Updated: 2025-06-21 - Modified to use direct DB inserts instead of RPC functions
 */

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { compressImage } from "@/components/forms/car-listing/photo-upload/utils/imageCompression";
import { standardizePhotoCategory } from "@/utils/photoMapping";

// Define types for temporary file tracking
interface TempFileMetadata {
  filePath: string;
  publicUrl: string;
  category: string; 
  uploadId: string;
  timestamp: string;
  fileType?: string;
  fileSize?: number;
  originalName?: string;
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
  
  // Standardize the category to ensure consistent field naming
  const standardCategory = standardizePhotoCategory(category);
  
  console.log(`Starting direct upload of ${files.length} files for car ${carId} (category: ${standardCategory})`);
  
  const uploadPromises = files.map(async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    // Standardized path structure for all car images
    const filePath = `cars/${userId}/${carId}/${standardCategory}/${fileName}`;
    
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
        console.error(`Error uploading ${standardCategory} image:`, error);
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
          category: standardCategory, // Use the dedicated category column
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
      await updateCarRecordWithImage(carId, filePath, standardCategory);
      
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
    // Standardize the category for consistent handling
    const standardCategory = standardizePhotoCategory(category);
    
    if (standardCategory.includes('rim_') || standardCategory.startsWith('required_')) {
      // Get current required_photos JSONB object
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('required_photos')
        .eq('id', carId)
        .single();
        
      if (!getError && car) {
        // Update the required_photos object with the new photo
        const requiredPhotos = car.required_photos || {};
        requiredPhotos[standardCategory] = filePath;
        
        // Update the car record with the modified JSONB
        await supabase
          .from('cars')
          .update({ required_photos: requiredPhotos })
          .eq('id', carId);
      }
    } else if (standardCategory === 'additional_photos') {
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

    // Standardize the category to ensure consistent field naming
    const standardCategory = standardizePhotoCategory(category);

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
    
    console.log(`Directly uploading file ${file.name} (${file.size} bytes) for ${carId === "temp" ? "temporary" : "existing"} car (${uploadId}), category: ${standardCategory}`);
    
    // Create unique file path using consistent structure
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `cars/${userId}/${uploadId}/${standardCategory}/${fileName}`;
    
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
          console.error('Retry upload also failed:', retryError);
          throw retryError;
        }
      } else {
        throw uploadError;
      }
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    // Only save to car_file_uploads if this is an actual car ID, not a temp one
    if (carId !== "temp") {
      try {
        // When we have an actual carId, directly insert a record into car_file_uploads
        // This will use the RLS policies we set up
        const { error: dbError } = await supabase
          .from('car_file_uploads')
          .insert({
            car_id: carId,
            file_path: filePath,
            file_type: file.type,
            category: standardCategory,
            upload_status: 'completed',
            image_metadata: {
              size: file.size,
              name: file.name,
              type: file.type,
              originalName: file.name
            }
          });
          
        if (dbError) {
          console.error('Error recording file upload to database:', dbError);
        }
      } catch (dbError) {
        console.error('Exception recording file upload to database:', dbError);
      }
    } else {
      // For temporary uploads, store metadata in localStorage for later association
      storeTempFileMetadata({
        filePath,
        publicUrl,
        category: standardCategory,
        uploadId: uuidv4(),
        timestamp: new Date().toISOString(),
        fileType: file.type,
        fileSize: file.size,
        originalName: file.name
      });
    }
    
    console.log(`Successfully uploaded file to ${filePath}. Public URL: ${publicUrl}`);
    return filePath;
    
  } catch (error) {
    console.error('Error in directUploadPhoto:', error);
    return null;
  }
};

/**
 * Store temporary file metadata in localStorage
 */
export const storeTempFileMetadata = (metadata: TempFileMetadata): void => {
  try {
    const existingDataStr = localStorage.getItem('tempFileUploads');
    let existingData: TempFileMetadata[] = [];
    
    if (existingDataStr) {
      try {
        existingData = JSON.parse(existingDataStr);
        // Validate it's actually an array
        if (!Array.isArray(existingData)) {
          console.error('Invalid tempFileUploads format in localStorage, resetting');
          existingData = [];
        }
      } catch (e) {
        console.error('Error parsing tempFileUploads:', e);
        existingData = [];
      }
    }
    
    // Add new metadata
    existingData.push(metadata);
    
    // Store back to localStorage
    localStorage.setItem('tempFileUploads', JSON.stringify(existingData));
    
    console.log(`[storeTempFileMetadata] Stored metadata for file ${metadata.filePath}, total: ${existingData.length}`);
  } catch (error) {
    console.error('Error storing temp file metadata:', error);
  }
};

/**
 * Associate temporary uploads with a car
 * This uses the direct insertion method with RLS policies
 */
export const associateTempUploadsWithCar = async (carId: string): Promise<number> => {
  try {
    if (!carId) {
      throw new Error('No car ID provided');
    }
    
    console.log(`[associateTempUploadsWithCar] Starting association for car ${carId}`);
    
    // Get temporary uploads from localStorage
    const tempUploadsStr = localStorage.getItem('tempFileUploads');
    if (!tempUploadsStr) {
      console.log(`[associateTempUploadsWithCar] No temp uploads found`);
      return 0;
    }
    
    // Parse temporary uploads
    let tempUploads: TempFileMetadata[];
    try {
      tempUploads = JSON.parse(tempUploadsStr);
      if (!Array.isArray(tempUploads)) {
        throw new Error('Invalid tempFileUploads format');
      }
    } catch (e) {
      console.error(`[associateTempUploadsWithCar] Error parsing temp uploads:`, e);
      return 0;
    }
    
    if (tempUploads.length === 0) {
      console.log(`[associateTempUploadsWithCar] Temp uploads array is empty`);
      return 0;
    }
    
    console.log(`[associateTempUploadsWithCar] Found ${tempUploads.length} temp uploads to associate`);
    
    // This will track successful records
    const insertedRecords: any[] = [];
    
    // Process each upload with direct database insert
    for (const upload of tempUploads) {
      try {
        // Prepare the data for insertion
        const fileUpload = {
          car_id: carId,
          file_path: upload.filePath,
          file_type: upload.fileType || 'image/jpeg',
          category: standardizePhotoCategory(upload.category),
          upload_status: 'completed',
          image_metadata: {
            publicUrl: upload.publicUrl,
            originalName: upload.originalName || 'image.jpg',
            size: upload.fileSize,
            uploadId: upload.uploadId,
            timestamp: upload.timestamp
          }
        };
        
        // Insert directly to car_file_uploads - uses our RLS policies
        const { data, error } = await supabase
          .from('car_file_uploads')
          .insert(fileUpload)
          .select();
        
        if (error) {
          console.error(`[associateTempUploadsWithCar] Error inserting file upload record:`, error);
          continue;
        }
        
        insertedRecords.push(data[0]);
        
        // Also update the car's photo fields to ensure UI consistency
        await updateCarRecordWithImage(carId, upload.filePath, upload.category);
        
      } catch (err) {
        console.error(`[associateTempUploadsWithCar] Error processing upload:`, err);
      }
    }
    
    // Clear the temp uploads from localStorage after successful association
    if (insertedRecords.length > 0) {
      localStorage.removeItem('tempFileUploads');
      console.log(`[associateTempUploadsWithCar] Successfully associated ${insertedRecords.length} images with car ${carId}`);
    }
    
    return insertedRecords.length;
    
  } catch (error) {
    console.error('[associateTempUploadsWithCar] Association error:', error);
    return 0;
  }
};

export default {
  directUploadPhoto,
  uploadImagesForCar,
  getPublicUrl,
  associateTempUploadsWithCar,
  storeTempFileMetadata
};
