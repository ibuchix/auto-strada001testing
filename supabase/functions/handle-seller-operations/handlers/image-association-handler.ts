
/**
 * Image association handler for handle-seller-operations
 * Created: 2025-06-01
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ImageAssociationRequest, TempUploadsRequest, DirectAssociateRequest } from '../schema-validation.ts';
import { logOperation } from '../utils/logging.ts';
import { formatResponse } from '../shared.ts';

// In-memory temporary storage for uploads
let tempUploadsStorage: any[] = [];

/**
 * Store temporary uploads for later association
 */
export async function handleSetTempUploads(
  supabase: SupabaseClient,
  data: TempUploadsRequest,
  requestId: string
): Promise<Response> {
  try {
    const { uploads } = data;
    
    // Log operation start
    logOperation('set_temp_uploads_start', { requestId, uploadCount: uploads.length });
    
    // Store uploads in memory
    tempUploadsStorage = uploads;
    
    logOperation('set_temp_uploads_complete', { 
      requestId,
      success: true,
      storedCount: tempUploadsStorage.length
    });
    
    return formatResponse.success({
      success: true,
      count: tempUploadsStorage.length,
      message: `Successfully stored ${tempUploadsStorage.length} uploads for association`
    });
  } catch (error) {
    logOperation('set_temp_uploads_error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatResponse.error(
      error.message || 'An error occurred storing temp uploads',
      400,
      error.code || 'TEMP_UPLOADS_ERROR'
    );
  }
}

/**
 * Associate temporary uploads with a car
 */
export async function handleAssociateImages(
  supabase: SupabaseClient,
  data: ImageAssociationRequest,
  requestId: string
): Promise<Response> {
  try {
    const { carId } = data;
    
    // Log operation start
    logOperation('associate_images_start', { requestId, carId });
    
    // Validate car ID
    const { data: carCheck, error: carError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', carId)
      .single();
    
    if (carError || !carCheck) {
      logOperation('associate_images_error', { 
        requestId, 
        carId,
        error: carError?.message || 'Car not found'
      }, 'error');
      
      return formatResponse.error(
        'Invalid car ID or car not found',
        400,
        'CAR_NOT_FOUND'
      );
    }
    
    // Use stored temp uploads
    const uploads = tempUploadsStorage;
    
    if (!uploads || uploads.length === 0) {
      logOperation('associate_images_warning', { 
        requestId, 
        carId,
        warning: 'No temp uploads found'
      }, 'warn');
      
      return formatResponse.success({
        success: true,
        count: 0,
        message: 'No temporary uploads found to associate'
      });
    }
    
    // Associate each upload with the car
    const results = [];
    let successCount = 0;
    
    for (const upload of uploads) {
      try {
        const { filePath, category, publicUrl } = upload;
        
        if (!filePath) {
          logOperation('associate_images_skip', { 
            requestId, 
            carId,
            reason: 'Missing filePath in upload'
          }, 'warn');
          continue;
        }
        
        // Insert into car_images table
        const { data: insertData, error: insertError } = await supabase
          .from('car_images')
          .insert({
            car_id: carId,
            storage_path: filePath,
            image_url: publicUrl || filePath,
            category: category || 'additional_photos'
          });
        
        if (insertError) {
          logOperation('associate_image_error', { 
            requestId, 
            carId,
            filePath,
            error: insertError.message
          }, 'warn');
          
          results.push({
            filePath,
            success: false,
            error: insertError.message
          });
        } else {
          successCount++;
          results.push({
            filePath,
            success: true
          });
        }
      } catch (uploadError) {
        logOperation('associate_image_exception', { 
          requestId, 
          carId,
          error: uploadError.message
        }, 'error');
        
        results.push({
          upload,
          success: false,
          error: uploadError.message
        });
      }
    }
    
    // Clear temp uploads after association attempt
    tempUploadsStorage = [];
    
    logOperation('associate_images_complete', { 
      requestId,
      carId,
      success: true,
      associatedCount: successCount,
      totalAttempted: uploads.length
    });
    
    return formatResponse.success({
      success: true,
      count: successCount,
      results,
      message: `Successfully associated ${successCount} of ${uploads.length} uploads`
    });
  } catch (error) {
    logOperation('associate_images_error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatResponse.error(
      error.message || 'An error occurred associating images',
      400,
      error.code || 'IMAGE_ASSOCIATION_ERROR'
    );
  }
}

/**
 * Associate specific uploads with a car (direct association)
 */
export async function handleDirectAssociateUploads(
  supabase: SupabaseClient,
  data: DirectAssociateRequest,
  requestId: string
): Promise<Response> {
  try {
    const { carId, uploads } = data;
    
    // Log operation start
    logOperation('direct_associate_uploads_start', { 
      requestId, 
      carId, 
      uploadCount: uploads.length 
    });
    
    // Validate car ID
    const { data: carCheck, error: carError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', carId)
      .single();
    
    if (carError || !carCheck) {
      logOperation('direct_associate_error', { 
        requestId, 
        carId,
        error: carError?.message || 'Car not found'
      }, 'error');
      
      return formatResponse.error(
        'Invalid car ID or car not found',
        400,
        'CAR_NOT_FOUND'
      );
    }
    
    if (!uploads || uploads.length === 0) {
      logOperation('direct_associate_warning', { 
        requestId, 
        carId,
        warning: 'No uploads provided'
      }, 'warn');
      
      return formatResponse.success({
        success: true,
        count: 0,
        message: 'No uploads provided to associate'
      });
    }
    
    // Associate each upload with the car
    const results = [];
    let successCount = 0;
    
    for (const upload of uploads) {
      try {
        const { filePath, category, publicUrl } = upload;
        
        if (!filePath) {
          logOperation('direct_associate_skip', { 
            requestId, 
            carId,
            reason: 'Missing filePath in upload'
          }, 'warn');
          continue;
        }
        
        // Insert into car_images table
        const { data: insertData, error: insertError } = await supabase
          .from('car_images')
          .insert({
            car_id: carId,
            storage_path: filePath,
            image_url: publicUrl || filePath,
            category: category || 'additional_photos'
          });
        
        if (insertError) {
          logOperation('direct_associate_error', { 
            requestId, 
            carId,
            filePath,
            error: insertError.message
          }, 'warn');
          
          results.push({
            filePath,
            success: false,
            error: insertError.message
          });
        } else {
          successCount++;
          results.push({
            filePath,
            success: true
          });
        }
      } catch (uploadError) {
        logOperation('direct_associate_exception', { 
          requestId, 
          carId,
          error: uploadError.message
        }, 'error');
        
        results.push({
          upload,
          success: false,
          error: uploadError.message
        });
      }
    }
    
    logOperation('direct_associate_complete', { 
      requestId,
      carId,
      success: true,
      associatedCount: successCount,
      totalAttempted: uploads.length
    });
    
    return formatResponse.success({
      success: true,
      count: successCount,
      results,
      message: `Successfully associated ${successCount} of ${uploads.length} uploads`
    });
  } catch (error) {
    logOperation('direct_associate_error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatResponse.error(
      error.message || 'An error occurred associating uploads',
      400,
      error.code || 'DIRECT_ASSOCIATION_ERROR'
    );
  }
}
