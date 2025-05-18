/**
 * Image Upload Manager Hook
 * Created: 2025-05-24
 * 
 * Manages image uploads for car listings, including:
 * - Auto-save pausing during uploads
 * - Progress tracking
 * - Upload finalization for form submission
 */

import { useState, useCallback, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImagesForCar } from '@/services/supabase/uploadService';

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
  
  // Start upload process
  const startUpload = useCallback(() => {
    setIsUploading(true);
    setUploadProgress(0);
    if (pauseAutoSave) {
      console.log('Pausing auto-save during upload');
      pauseAutoSave();
    }
  }, [pauseAutoSave]);
  
  // Update progress
  const updateProgress = useCallback((progress: number) => {
    setUploadProgress(progress);
  }, []);
  
  // Finish upload process
  const finishUpload = useCallback((success: boolean, error?: Error) => {
    setIsUploading(false);
    setUploadProgress(0);
    
    if (resumeAutoSave) {
      console.log('Resuming auto-save after upload');
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
    pendingFilesRef.current.push(file);
  }, []);
  
  // Finalize all uploads when form is submitted
  const finalizeUploads = useCallback(async (formCarId: string): Promise<string[]> => {
    const targetCarId = formCarId || carId;
    
    if (!targetCarId) {
      console.error('Missing carId, cannot finalize uploads');
      return [];
    }
    
    if (pendingFilesRef.current.length === 0) {
      console.log('No pending files to finalize');
      return [];
    }
    
    console.log(`Finalizing ${pendingFilesRef.current.length} uploads for car ${targetCarId}`);
    
    try {
      // Get user ID from session
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Upload all pending files using the upload service
      const uploadedPaths = await uploadImagesForCar(
        pendingFilesRef.current,
        targetCarId,
        'additional_photos',
        userId
      );
      
      console.log(`Successfully uploaded ${uploadedPaths.length} files`);
      
      // Clear pending files after successful upload
      pendingFilesRef.current = [];
      
      return uploadedPaths;
    } catch (error) {
      console.error('Error finalizing uploads:', error);
      throw error;
    }
  }, [carId]);
  
  return {
    isUploading,
    uploadProgress,
    startUpload,
    updateProgress,
    finishUpload,
    registerPendingFile,
    finalizeUploads
  };
};
