
/**
 * Image Upload Manager Hook
 * Created: 2025-05-24
 * Updated: 2025-05-19 - Enhanced upload tracking, verification capabilities, and fallback mechanisms
 * Updated: 2025-05-24 - Modified to work with immediate uploads
 * Updated: 2025-05-25 - Added missing imports and interface definition for TempFileMetadata
 * Updated: 2025-05-26 - Improved error handling and tracking for pending files
 * 
 * Manages image uploads for car listings, including:
 * - Auto-save pausing during uploads
 * - Progress tracking
 * - Upload finalization for form submission
 * - Direct storage upload fallback
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { directUploadPhoto, associateTempUploadsWithCar } from '@/services/supabase/uploadService';

// Define the TempFileMetadata interface
interface TempFileMetadata {
  filePath: string;
  publicUrl: string;
  category: string;
  uploadId: string;
  timestamp: string;
}

interface UseImageUploadManagerProps {
  form: UseFormReturn<CarListingFormData>;
  pauseAutoSave?: () => void;
  resumeAutoSave?: () => void;
  carId?: string;
}

export const useImageUploadManager = ({
  form,
  pauseAutoSave,
  resumeAutoSave,
  carId
}: UseImageUploadManagerProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Keep track of temporary files that need to be finalized
  const pendingFilesRef = useRef<File[]>([]);
  const lastUploadTimeRef = useRef<number>(0);
  const uploadAttemptsRef = useRef<{[key: string]: number}>({});
  const uploadErrorsRef = useRef<{[key: string]: Error}>({});
  const maxAttemptsPerFile = 3;
  
  // Start upload process
  const startUpload = useCallback(() => {
    setIsUploading(true);
    setUploadProgress(0);
    lastUploadTimeRef.current = Date.now();
    if (pauseAutoSave) {
      console.log('[ImageUploadManager] Pausing auto-save during upload');
      pauseAutoSave();
    }
  }, [pauseAutoSave]);
  
  // Update progress
  const updateProgress = useCallback((progress: number) => {
    setUploadProgress(progress);
    lastUploadTimeRef.current = Date.now();
  }, []);
  
  // Finish upload process
  const finishUpload = useCallback((success: boolean, error?: Error) => {
    setIsUploading(false);
    setUploadProgress(0);
    lastUploadTimeRef.current = Date.now();
    
    if (resumeAutoSave) {
      console.log('[ImageUploadManager] Resuming auto-save after upload');
      resumeAutoSave();
    }
    
    if (!success && error) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: error.message || "Failed to upload images"
      });
    }
  }, [resumeAutoSave]);
  
  // Register a file to be finalized later
  const registerPendingFile = useCallback((file: File) => {
    const fileId = `${file.name}-${file.size}-${Date.now()}`;
    console.log(`[ImageUploadManager] Registering pending file: ${file.name} (${file.size} bytes) with ID: ${fileId}`);
    pendingFilesRef.current.push(file);
    lastUploadTimeRef.current = Date.now();
  }, []);
  
  // Check if there are any pending uploads or recent upload activity
  const checkUploadsComplete = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastUpload = now - lastUploadTimeRef.current;
    const uploadThreshold = 10000; // 10 seconds threshold for upload completion
    
    console.log(`[ImageUploadManager] Checking if uploads complete:`, {
      pendingFiles: pendingFilesRef.current.length,
      isCurrentlyUploading: isUploading,
      timeSinceLastUpload: `${timeSinceLastUpload}ms`,
      uploadThreshold: `${uploadThreshold}ms`,
    });
    
    // If actively uploading or had recent upload activity within threshold, return false
    if (isUploading || timeSinceLastUpload < uploadThreshold) {
      return false;
    }
    
    return true;
  }, [isUploading]);
  
  // Direct upload to storage (fallback method)
  const uploadDirectToStorage = useCallback(async (file: File, targetCarId: string, category: string): Promise<string | null> => {
    try {
      console.log(`[ImageUploadManager] Attempting direct storage upload for ${file.name} (${file.size} bytes)`);
      
      // Use the directUploadPhoto from uploadService directly
      const publicUrl = await directUploadPhoto(file, targetCarId, category);
      
      if (!publicUrl) {
        throw new Error('Failed to upload file to storage');
      }
      
      console.log(`[ImageUploadManager] Direct upload successful for ${file.name}. URL: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('[ImageUploadManager] Direct upload failed:', error);
      return null;
    }
  }, []);
  
  // Finalize all uploads when form is submitted
  const finalizeUploads = useCallback(async (formCarId: string): Promise<string[]> => {
    const targetCarId = formCarId || carId;
    
    if (!targetCarId) {
      console.error('[ImageUploadManager] Missing carId, cannot finalize uploads');
      return [];
    }
    
    // Check if we have any pending files that need to be uploaded
    if (pendingFilesRef.current.length === 0) {
      console.log('[ImageUploadManager] No pending files to finalize');
      
      // Instead, try to associate any uploads that were done already
      try {
        // We don't need to upload anything, just associate the existing uploads
        if (typeof associateTempUploadsWithCar === 'function') {
          const count = await associateTempUploadsWithCar(targetCarId);
          console.log(`[ImageUploadManager] Associated ${count} temporary uploads with car ${targetCarId}`);
          
          // Get the URLs from localStorage to return
          const tempUploadsStr = localStorage.getItem('tempFileUploads');
          if (tempUploadsStr) {
            try {
              const tempUploads: TempFileMetadata[] = JSON.parse(tempUploadsStr);
              return tempUploads.map(tu => tu.publicUrl);
            } catch (e) {
              console.warn('[ImageUploadManager] Error parsing temp uploads:', e);
            }
          }
        }
      } catch (error) {
        console.error('[ImageUploadManager] Error associating temp uploads:', error);
      }
      
      return [];
    }
    
    console.log(`[ImageUploadManager] Finalizing ${pendingFilesRef.current.length} uploads for car ${targetCarId}`);
    
    try {
      setIsUploading(true);
      lastUploadTimeRef.current = Date.now();
      
      const results: string[] = [];
      const errors: Error[] = [];
      
      // Process each file
      for (const file of pendingFilesRef.current) {
        try {
          const fileId = `${file.name}-${file.size}`;
          const attemptCount = uploadAttemptsRef.current[fileId] || 0;
          
          // Skip if max attempts reached
          if (attemptCount >= maxAttemptsPerFile) {
            console.warn(`[ImageUploadManager] Max attempts (${maxAttemptsPerFile}) reached for ${file.name}, skipping`);
            errors.push(new Error(`Max upload attempts reached for ${file.name}`));
            continue;
          }
          
          // Update retry count
          uploadAttemptsRef.current[fileId] = attemptCount + 1;
          
          console.log(`[ImageUploadManager] Uploading file ${file.name} for car ${targetCarId} (attempt ${attemptCount + 1})`);
          
          // Use direct storage upload as the primary method now
          const directUrl = await uploadDirectToStorage(file, targetCarId, 'additional_photos');
          
          if (directUrl) {
            results.push(directUrl);
          } else {
            errors.push(new Error(`Failed to upload ${file.name}`));
          }
        } catch (uploadError) {
          console.error(`[ImageUploadManager] Error uploading file ${file.name}:`, uploadError);
          errors.push(uploadError instanceof Error ? uploadError : new Error(`Failed to upload ${file.name}`));
        }
      }
      
      // Log summary
      console.log(`[ImageUploadManager] Finalization complete: ${results.length} successful, ${errors.length} failed`);
      
      // Clear pending files after processing
      pendingFilesRef.current = [];
      
      // Show a toast with the summary
      if (results.length > 0) {
        toast({
          title: `${results.length} images uploaded successfully`,
          description: errors.length > 0 ? `(${errors.length} failed)` : undefined,
          variant: errors.length > 0 ? "default" : "success"
        });
      } else if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: `All ${errors.length} images failed to upload`
        });
      }
      
      return results;
    } catch (error) {
      console.error('[ImageUploadManager] Error finalizing uploads:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Failed to process image uploads. Please try again."
      });
      throw error;
    } finally {
      setIsUploading(false);
      lastUploadTimeRef.current = Date.now();
    }
  }, [carId, uploadDirectToStorage]);
  
  // Register the global uploader service for form submission to access
  useEffect(() => {
    console.log('[ImageUploadManager] Registering global upload manager');
    
    // Provide global access to finalization methods
    (window as any).__tempFileUploadManager = {
      finalizeUploads: async (id: string) => {
        console.log(`[ImageUploadManager] Global uploader: Finalizing uploads for car ${id}`);
        try {
          return await finalizeUploads(id || carId || '');
        } catch (err) {
          console.error('[ImageUploadManager] Error in global uploader finalize:', err);
          throw err;
        }
      },
      checkUploadsComplete: () => {
        const result = checkUploadsComplete();
        console.log(`[ImageUploadManager] Global uploader: Check uploads complete: ${result}`);
        return result;
      },
      pendingFileCount: () => {
        return pendingFilesRef.current.length;
      }
    };
    
    return () => {
      console.log('[ImageUploadManager] Cleaning up global upload manager');
      (window as any).__tempFileUploadManager = null;
    };
  }, [finalizeUploads, carId, checkUploadsComplete]);
  
  return {
    isUploading,
    uploadProgress,
    startUpload,
    updateProgress,
    finishUpload,
    registerPendingFile,
    finalizeUploads,
    checkUploadsComplete,
    uploadDirectToStorage
  };
};
