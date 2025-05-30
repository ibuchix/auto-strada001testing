
/**
 * Photo Upload Hook
 * Updated: 2025-05-30 - Integrated with proper Supabase Storage handling
 */

import { useState, useCallback } from "react";
import { uploadCarImageToStorage } from "@/services/supabase/imageUploadService";
import { toast } from "sonner";

export interface UsePhotoUploadOptions {
  onUploadSuccess?: (url: string, photoType: string) => void;
  onUploadError?: (error: string, photoType: string) => void;
  carId?: string;
}

export const usePhotoUpload = (options: UsePhotoUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const uploadPhoto = useCallback(async (
    file: File,
    photoType: string
  ): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      console.log('Starting photo upload:', { photoType, fileSize: file.size });
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const result = await uploadCarImageToStorage(file, photoType, options.carId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success && result.url) {
        console.log('Photo uploaded successfully:', result.url);
        
        if (options.onUploadSuccess) {
          options.onUploadSuccess(result.url, photoType);
        }
        
        return result.url;
      } else {
        const error = result.error || 'Upload failed';
        console.error('Photo upload failed:', error);
        
        if (options.onUploadError) {
          options.onUploadError(error, photoType);
        } else {
          toast.error('Upload Failed', {
            description: error
          });
        }
        
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Photo upload error:', errorMessage);
      
      if (options.onUploadError) {
        options.onUploadError(errorMessage, photoType);
      } else {
        toast.error('Upload Error', {
          description: errorMessage
        });
      }
      
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [options]);
  
  return {
    uploadPhoto,
    isUploading,
    uploadProgress
  };
};
