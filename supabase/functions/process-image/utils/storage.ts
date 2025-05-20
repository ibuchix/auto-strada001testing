
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from './logging.ts';
import { standardizePhotoCategory } from './helpers.ts';

/**
 * Uploads a file to storage
 * @param file The file to upload
 * @param carId The ID of the car the file belongs to
 * @param type The type of the file (e.g., "exterior_front", "additional_photos")
 * @returns Object containing the file path and supabase client
 */
export async function uploadFileToStorage(file: File, carId: string, type: string) {
  const requestId = crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  // Create Supabase client with service role key for admin access
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Generate unique filename
  const uniqueId = crypto.randomUUID();
  
  // Get file extension
  const fileExt = file.name.split('.').pop();
  
  // Standardize category/type for consistent storage
  const standardizedType = standardizePhotoCategory(type);
  
  // Create path for the file
  const filePath = `cars/${carId}/${standardizedType}/${uniqueId}.${fileExt}`;
  
  logOperation('storage_upload_start', { requestId, filePath }, 'info');
  
  try {
    // Upload file to storage
    const { error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      logOperation('storage_upload_error', { requestId, error: error.message }, 'error');
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    
    logOperation('storage_upload_success', { requestId, filePath }, 'info');
    
    return { filePath, supabase };
  } catch (error) {
    logOperation('storage_upload_exception', { 
      requestId, 
      error: (error as Error).message 
    }, 'error');
    throw error;
  }
}

/**
 * Logs a file upload to the database
 * @param supabase Supabase client
 * @param carId The ID of the car the file belongs to
 * @param filePath The path of the uploaded file
 * @param type The type of the file
 * @param file The file metadata
 */
export async function logFileUpload(
  supabase: any,
  carId: string,
  filePath: string,
  type: string,
  file: File
) {
  const requestId = crypto.randomUUID();
  
  // Standardize the category for consistency
  const standardizedType = standardizePhotoCategory(type);
  
  logOperation('db_log_start', { requestId, filePath, type: standardizedType }, 'info');
  
  try {
    // Insert record into car_file_uploads table
    const { error } = await supabase
      .from('car_file_uploads')
      .insert({
        car_id: carId,
        file_path: filePath,
        file_type: file.type,
        upload_status: 'completed',
        category: standardizedType, // Use the dedicated category column
        image_metadata: {
          size: file.size,
          name: file.name,
          content_type: file.type
        }
      });
      
    if (error) {
      logOperation('db_log_error', { 
        requestId, 
        error: error.message, 
        details: error.details 
      }, 'error');
      throw new Error(`Failed to log file upload: ${error.message}`);
    }
    
    logOperation('db_log_success', { requestId, filePath }, 'info');
  } catch (error) {
    logOperation('db_log_exception', { 
      requestId, 
      error: (error as Error).message 
    }, 'error');
    throw error;
  }
}

/**
 * Updates a car record with image information
 * @param supabase Supabase client
 * @param type The type of the file
 * @param filePath The path of the uploaded file 
 * @param carId The ID of the car
 */
export async function updateCarRecord(
  supabase: any,
  type: string,
  filePath: string,
  carId: string
) {
  const requestId = crypto.randomUUID();
  
  // Standardize the category for consistency
  const standardizedType = standardizePhotoCategory(type);
  
  logOperation('car_update_start', { 
    requestId, 
    filePath, 
    type: standardizedType, 
    carId 
  }, 'info');
  
  try {
    if (standardizedType === 'additional_photos') {
      // For additional photos, add to the array
      // First get current additional_photos
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('additional_photos')
        .eq('id', carId)
        .single();
        
      if (getError) {
        logOperation('car_read_error', { 
          requestId, 
          error: getError.message 
        }, 'error');
        throw new Error(`Failed to read car record: ${getError.message}`);
      }
      
      // Get current photos or initialize empty array
      const currentPhotos = car?.additional_photos || [];
      const updatedPhotos = Array.isArray(currentPhotos) 
        ? [...currentPhotos, filePath] 
        : [filePath];
      
      // Update car record with the additional photo
      const { error: updateError } = await supabase
        .from('cars')
        .update({ additional_photos: updatedPhotos })
        .eq('id', carId);
        
      if (updateError) {
        logOperation('car_update_error', { 
          requestId, 
          error: updateError.message 
        }, 'error');
        throw new Error(`Failed to update car record: ${updateError.message}`);
      }
    } else {
      // For required photos, add to the required_photos object
      // First get current required_photos
      const { data: car, error: getError } = await supabase
        .from('cars')
        .select('required_photos')
        .eq('id', carId)
        .single();
        
      if (getError) {
        logOperation('car_read_error', { 
          requestId, 
          error: getError.message 
        }, 'error');
        throw new Error(`Failed to read car record: ${getError.message}`);
      }
      
      // Get current required_photos or initialize empty object
      const requiredPhotos = car?.required_photos || {};
      requiredPhotos[standardizedType] = filePath;
      
      // Update car record with the required photo
      const { error: updateError } = await supabase
        .from('cars')
        .update({ required_photos: requiredPhotos })
        .eq('id', carId);
        
      if (updateError) {
        logOperation('car_update_error', { 
          requestId, 
          error: updateError.message 
        }, 'error');
        throw new Error(`Failed to update car record: ${updateError.message}`);
      }
    }
    
    logOperation('car_update_success', { requestId, carId }, 'info');
  } catch (error) {
    logOperation('car_update_exception', { 
      requestId, 
      error: (error as Error).message 
    }, 'error');
    throw error;
  }
}
