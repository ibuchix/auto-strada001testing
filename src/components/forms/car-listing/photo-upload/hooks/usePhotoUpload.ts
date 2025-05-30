
/**
 * Photo Upload Hook
 * Updated: 2025-05-30 - Phase 3: Enhanced with progress tracking and error handling
 */

import { useState, useCallback } from "react";
import { uploadCarImageToStorage, UploadProgress } from "@/services/supabase/imageUploadService";
import { validateImageUrl, isBlobUrl } from "@/utils/imageUtils";
import { toast } from "sonner";

export interface UsePhotoUploadOptions {
  onUploadSuccess?: (url: string, photoType: string) => void;
  onUploadError?: (error: string, photoType: string) => void;
  onUploadProgress?: (photoType: string, progress: UploadProgress) => void;
  carId?: string;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  currentPhotoType?: string;
  error?: string;
}

export const usePhotoUpload = (options: UsePhotoUploadOptions = {}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0
  });
  
  const uploadPhoto = useCallback(async (
    file: File,
    photoType: string
  ): Promise<string | null> => {
    try {
      // Validate file before upload
      if (!file || file.size === 0) {
        const error = 'Invalid file provided';
        setUploadState({ isUploading: false, progress: 0, error });
        
        if (options.onUploadError) {
          options.onUploadError(error, photoType);
        } else {
          toast.error('Upload Failed', { description: error });
        }
        return null;
      }
      
      // Check for blob URL in file name (shouldn't happen, but defensive)
      if (file.name.includes('blob')) {
        console.warn('File appears to be from blob URL, proceeding with caution');
      }
      
      setUploadState({
        isUploading: true,
        progress: 0,
        currentPhotoType: photoType,
        error: undefined
      });
      
      console.log('Starting photo upload:', { photoType, fileSize: file.size });
      
      const result = await uploadCarImageToStorage(
        file, 
        photoType, 
        options.carId,
        (progress: UploadProgress) => {
          setUploadState(prev => ({
            ...prev,
            progress: progress.percentage
          }));
          
          if (options.onUploadProgress) {
            options.onUploadProgress(photoType, progress);
          }
        }
      );
      
      if (result.success && result.url) {
        // Double-check that we didn't somehow get a blob URL
        if (isBlobUrl(result.url)) {
          const error = 'Upload service returned invalid blob URL';
          console.error(error, result.url);
          
          setUploadState({
            isUploading: false,
            progress: 0,
            error
          });
          
          if (options.onUploadError) {
            options.onUploadError(error, photoType);
          } else {
            toast.error('Upload Error', { description: error });
          }
          return null;
        }
        
        // Validate the URL
        const validation = validateImageUrl(result.url);
        if (!validation.isValid) {
          const error = `Invalid URL returned: ${validation.error}`;
          console.error(error);
          
          setUploadState({
            isUploading: false,
            progress: 0,
            error
          });
          
          if (options.onUploadError) {
            options.onUploadError(error, photoType);
          } else {
            toast.error('Upload Error', { description: error });
          }
          return null;
        }
        
        console.log('Photo uploaded successfully:', result.url);
        
        setUploadState({
          isUploading: false,
          progress: 100,
          currentPhotoType: undefined,
          error: undefined
        });
        
        if (options.onUploadSuccess) {
          options.onUploadSuccess(validation.sanitizedUrl!, photoType);
        }
        
        // Reset progress after a short delay
        setTimeout(() => {
          setUploadState(prev => ({ ...prev, progress: 0 }));
        }, 1000);
        
        return validation.sanitizedUrl!;
      } else {
        const error = result.error || 'Upload failed';
        console.error('Photo upload failed:', error);
        
        setUploadState({
          isUploading: false,
          progress: 0,
          error
        });
        
        if (options.onUploadError) {
          options.onUploadError(error, photoType);
        } else {
          toast.error('Upload Failed', { description: error });
        }
        
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Photo upload error:', errorMessage);
      
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage
      });
      
      if (options.onUploadError) {
        options.onUploadError(errorMessage, photoType);
      } else {
        toast.error('Upload Error', { description: errorMessage });
      }
      
      return null;
    }
  }, [options]);
  
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 0,
      currentPhotoType: undefined,
      error: undefined
    });
  }, []);
  
  return {
    uploadPhoto,
    uploadState,
    resetUploadState,
    // Legacy props for backward compatibility
    isUploading: uploadState.isUploading,
    uploadProgress: uploadState.progress
  };
};
