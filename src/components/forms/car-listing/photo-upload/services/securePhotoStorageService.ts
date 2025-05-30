
/**
 * Secure Photo Storage Service
 * Created: 2025-05-30 - Enhanced security for photo uploads
 */

import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { validateFileUpload } from '@/services/securityValidationService';
import { STORAGE_BUCKET, STORAGE_PATHS } from "@/config/storage";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * Securely uploads a photo with comprehensive validation
 */
export const secureUploadPhoto = async (
  file: File, 
  carId: string, 
  category: string
): Promise<string | null> => {
  try {
    console.log(`Starting secure upload for file: ${file.name}, category: ${category}`);
    
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User authentication required for file upload');
    }
    
    // Comprehensive file validation
    const validationResult = await validateFileUpload(file, userId);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error || 'File validation failed');
    }
    
    // Verify user owns the car (if not temp upload)
    if (carId !== "temp") {
      const { data: carData, error: carError } = await supabase
        .from('cars')
        .select('seller_id')
        .eq('id', carId)
        .single();
      
      if (carError || !carData || carData.seller_id !== userId) {
        throw new Error('Unauthorized: You can only upload photos for your own cars');
      }
    }
    
    // Generate secure file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const secureFileName = `${uuidv4()}.${fileExt}`;
    const filePath = carId === "temp" 
      ? `${STORAGE_PATHS.TEMP}${category}/${secureFileName}`
      : `${STORAGE_PATHS.CARS}${carId}/${category}/${secureFileName}`;
    
    console.log(`Uploading to secure path: ${filePath}`);
    
    // Upload with retry mechanism
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);
        
        // Log successful upload
        await logSecurityEvent(userId, 'file_upload_success', {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          category: category,
          car_id: carId,
          file_path: filePath
        });
        
        console.log(`Secure upload successful: ${publicUrl}`);
        return publicUrl;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Upload failed');
        
        if (attempt < MAX_RETRIES) {
          console.warn(`Upload attempt ${attempt + 1} failed, retrying...`, error);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }
    
    // Log failed upload
    await logSecurityEvent(userId, 'file_upload_failed', {
      file_name: file.name,
      error: lastError?.message,
      attempts: MAX_RETRIES + 1
    }, 'high');
    
    throw lastError || new Error('Upload failed after all retries');
    
  } catch (error) {
    console.error('Secure photo upload error:', error);
    throw error;
  }
};

/**
 * Validates and uploads multiple photos securely
 */
export const secureUploadMultiplePhotos = async (
  files: File[],
  carId: string,
  category: string
): Promise<string[]> => {
  console.log(`Starting secure batch upload of ${files.length} files`);
  
  const results: string[] = [];
  const errors: Error[] = [];
  
  // Process files sequentially to avoid overwhelming the server
  for (const file of files) {
    try {
      const url = await secureUploadPhoto(file, carId, category);
      if (url) {
        results.push(url);
      }
    } catch (error) {
      console.error(`Error uploading file ${file.name}:`, error);
      errors.push(error instanceof Error ? error : new Error(`Upload failed for ${file.name}`));
    }
  }
  
  // Log batch upload results
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user?.id) {
    await logSecurityEvent(session.user.id, 'batch_file_upload', {
      total_files: files.length,
      successful_uploads: results.length,
      failed_uploads: errors.length,
      category: category,
      car_id: carId
    });
  }
  
  console.log(`Batch upload complete: ${results.length} successful, ${errors.length} failed`);
  
  // If all uploads failed, throw an error
  if (errors.length === files.length && files.length > 0) {
    throw new Error(`All ${files.length} uploads failed. Please try again.`);
  }
  
  return results;
};

/**
 * Securely deletes a photo file
 */
export const secureDeletePhoto = async (filePath: string, carId: string): Promise<boolean> => {
  try {
    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    
    if (!userId) {
      throw new Error('User authentication required for file deletion');
    }
    
    // Verify user owns the car
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .select('seller_id')
      .eq('id', carId)
      .single();
    
    if (carError || !carData || carData.seller_id !== userId) {
      throw new Error('Unauthorized: You can only delete photos for your own cars');
    }
    
    // Delete file from storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
    
    // Log successful deletion
    await logSecurityEvent(userId, 'file_delete_success', {
      file_path: filePath,
      car_id: carId
    });
    
    return true;
    
  } catch (error) {
    console.error('Secure photo deletion error:', error);
    
    // Log failed deletion
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await logSecurityEvent(session.user.id, 'file_delete_failed', {
        file_path: filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'medium');
    }
    
    return false;
  }
};

/**
 * Logs security events for audit purposes
 */
const logSecurityEvent = async (
  userId: string,
  eventType: string,
  eventData: any,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<void> => {
  try {
    await supabase.rpc('log_security_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_event_data: eventData,
      p_severity: severity
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};
