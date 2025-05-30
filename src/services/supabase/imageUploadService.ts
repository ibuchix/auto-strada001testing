
/**
 * Image Upload Service for Car Listings
 * Updated: 2025-05-30 - Phase 4: Fixed to properly handle File objects from form
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateImageUrl, isBlobUrl, isDataUrl } from "@/utils/imageUtils";

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

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload a single car image to Supabase Storage
 */
export const uploadCarImageToStorage = async (
  file: File,
  photoType: string,
  carId?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<ImageUploadResult> => {
  try {
    console.log('Uploading image to storage:', { photoType, carId, fileSize: file.size, fileName: file.name });
    
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
    
    // Simulate progress reporting
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }
    
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
    
    // Complete progress
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('car-images')
      .getPublicUrl(filePath);
    
    // Validate the returned URL
    const urlValidation = validateImageUrl(publicUrl);
    if (!urlValidation.isValid) {
      console.error('Generated URL failed validation:', urlValidation.error);
      return {
        success: false,
        error: `Generated URL is invalid: ${urlValidation.error}`
      };
    }
    
    console.log('Image uploaded successfully:', { filePath, publicUrl });
    
    return {
      success: true,
      url: urlValidation.sanitizedUrl,
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
 * Process required photos - now properly handles File objects
 */
export const processRequiredPhotos = async (
  requiredPhotos: Record<string, File | string>,
  carId?: string,
  onProgress?: (photoType: string, progress: UploadProgress) => void
): Promise<Record<string, string>> => {
  const processedPhotos: Record<string, string> = {};
  
  console.log('Processing required photos:', Object.keys(requiredPhotos));
  
  for (const [photoType, fileOrUrl] of Object.entries(requiredPhotos)) {
    if (fileOrUrl instanceof File) {
      console.log(`Uploading File for ${photoType}:`, fileOrUrl.name);
      
      // Upload new file
      const result = await uploadCarImageToStorage(
        fileOrUrl, 
        photoType, 
        carId,
        onProgress ? (progress) => onProgress(photoType, progress) : undefined
      );
      
      if (result.success && result.url) {
        processedPhotos[photoType] = result.url;
        console.log(`Successfully uploaded ${photoType}:`, result.url);
      } else {
        console.error(`Failed to upload required photo ${photoType}:`, result.error);
        toast.error(`Failed to upload ${photoType}`, {
          description: result.error
        });
      }
    } else if (typeof fileOrUrl === 'string' && fileOrUrl.length > 0) {
      // Handle existing URL - reject blob URLs
      if (isBlobUrl(fileOrUrl) || isDataUrl(fileOrUrl)) {
        console.warn(`Rejecting blob/data URL for ${photoType}:`, fileOrUrl);
        toast.error(`Invalid image URL for ${photoType}`, {
          description: 'Blob URLs are not allowed. Please re-upload the image.'
        });
        continue;
      }
      
      const urlValidation = validateImageUrl(fileOrUrl);
      if (urlValidation.isValid && urlValidation.sanitizedUrl) {
        processedPhotos[photoType] = urlValidation.sanitizedUrl;
      } else {
        console.warn(`Invalid URL for ${photoType}:`, urlValidation.error);
      }
    }
  }
  
  console.log('Processed required photos result:', Object.keys(processedPhotos));
  return processedPhotos;
};

/**
 * Process additional photos - now properly handles File objects
 */
export const processAdditionalPhotos = async (
  additionalPhotos: (File | string)[],
  carId?: string,
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<string[]> => {
  const processedPhotos: string[] = [];
  
  console.log('Processing additional photos:', additionalPhotos.length);
  
  for (let i = 0; i < additionalPhotos.length; i++) {
    const photoItem = additionalPhotos[i];
    
    if (photoItem instanceof File) {
      console.log(`Uploading additional File ${i}:`, photoItem.name);
      
      // Upload new file
      const result = await uploadCarImageToStorage(
        photoItem,
        `additional_${i}`,
        carId,
        onProgress ? (progress) => onProgress(i, progress) : undefined
      );
      
      if (result.success && result.url) {
        processedPhotos.push(result.url);
        console.log(`Successfully uploaded additional photo ${i}:`, result.url);
      } else {
        console.error(`Failed to upload additional photo ${i}:`, result.error);
        toast.error(`Failed to upload additional photo ${i + 1}`, {
          description: result.error
        });
      }
    } else if (typeof photoItem === 'string' && photoItem.length > 0) {
      // Handle existing URL - reject blob URLs
      if (isBlobUrl(photoItem) || isDataUrl(photoItem)) {
        console.warn(`Rejecting blob/data URL for additional photo ${i}:`, photoItem);
        toast.error(`Invalid additional photo ${i + 1}`, {
          description: 'Blob URLs are not allowed. Please re-upload the image.'
        });
        continue;
      }
      
      const urlValidation = validateImageUrl(photoItem);
      if (urlValidation.isValid && urlValidation.sanitizedUrl) {
        processedPhotos.push(urlValidation.sanitizedUrl);
      } else {
        console.warn(`Invalid URL for additional photo ${i}:`, urlValidation.error);
      }
    }
  }
  
  console.log('Processed additional photos result:', processedPhotos.length);
  return processedPhotos;
};
