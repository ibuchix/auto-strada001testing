/**
 * Image Upload Service for Car Listings
 * Created: 2025-05-30 - Centralized image upload handling for Supabase Storage
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  filePath?: string;
}

export interface PhotoUploadData {
  file: File;
  photoType: string;
  carId?: string;
}

/**
 * Upload a single car image to Supabase Storage
 */
export const uploadCarImageToStorage = async (
  file: File,
  photoType: string,
  carId?: string
): Promise<ImageUploadResult> => {
  try {
    console.log('Uploading image to storage:', { photoType, carId, fileSize: file.size });
    
    // Validate file
    if (!file || file.size === 0) {
      return { success: false, error: 'Invalid file provided' };
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 10MB' };
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${photoType}_${timestamp}_${randomString}.${fileExtension}`;
    
    // Create file path
    const filePath = carId 
      ? `cars/${carId}/${fileName}`
      : `temp/${fileName}`;
    
    console.log('Uploading to path:', filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('car-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return { 
        success: false, 
        error: `Upload failed: ${error.message}` 
      };
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    console.log('Image uploaded successfully:', { filePath, publicUrl });
    
    return {
      success: true,
      url: publicUrl,
      filePath: filePath
    };
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
};

/**
 * Upload multiple images for a car listing
 */
export const uploadMultipleCarImages = async (
  uploads: PhotoUploadData[],
  carId?: string
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  
  for (const upload of uploads) {
    const result = await uploadCarImageToStorage(
      upload.file,
      upload.photoType,
      carId
    );
    
    if (result.success && result.url) {
      results[upload.photoType] = result.url;
    } else {
      console.error(`Failed to upload ${upload.photoType}:`, result.error);
      // Continue with other uploads even if one fails
    }
  }
  
  return results;
};

/**
 * Process required photos and upload to storage
 */
export const processRequiredPhotos = async (
  requiredPhotos: Record<string, File | string>,
  carId?: string
): Promise<Record<string, string>> => {
  const processedPhotos: Record<string, string> = {};
  
  for (const [photoType, fileOrUrl] of Object.entries(requiredPhotos)) {
    if (fileOrUrl instanceof File) {
      // Upload new file
      const result = await uploadCarImageToStorage(fileOrUrl, photoType, carId);
      if (result.success && result.url) {
        processedPhotos[photoType] = result.url;
      }
    } else if (typeof fileOrUrl === 'string' && fileOrUrl.length > 0) {
      // Keep existing URL (already uploaded)
      processedPhotos[photoType] = fileOrUrl;
    }
  }
  
  return processedPhotos;
};

/**
 * Process additional photos and upload to storage
 */
export const processAdditionalPhotos = async (
  additionalPhotos: (File | string)[],
  carId?: string
): Promise<string[]> => {
  const processedPhotos: string[] = [];
  
  for (let i = 0; i < additionalPhotos.length; i++) {
    const photoItem = additionalPhotos[i];
    
    if (photoItem instanceof File) {
      // Upload new file
      const result = await uploadCarImageToStorage(
        photoItem,
        `additional_${i}`,
        carId
      );
      if (result.success && result.url) {
        processedPhotos.push(result.url);
      }
    } else if (typeof photoItem === 'string' && photoItem.length > 0) {
      // Keep existing URL (already uploaded)
      processedPhotos.push(photoItem);
    }
  }
  
  return processedPhotos;
};
