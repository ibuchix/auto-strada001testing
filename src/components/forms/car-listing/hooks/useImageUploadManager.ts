
/**
 * Hook for managing image uploads with auto-save control
 * Created: 2025-06-04
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

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
  const uploadCountRef = useRef(0);
  
  // Function to start an upload operation
  const startUpload = useCallback(() => {
    if (uploadCountRef.current === 0 && pauseAutoSave) {
      console.log('Pausing auto-save for image upload');
      pauseAutoSave();
    }
    
    uploadCountRef.current++;
    setIsUploading(true);
  }, [pauseAutoSave]);
  
  // Function to finish an upload operation
  const finishUpload = useCallback((success: boolean = true, error?: Error) => {
    uploadCountRef.current = Math.max(0, uploadCountRef.current - 1);
    
    if (uploadCountRef.current === 0) {
      setIsUploading(false);
      setUploadProgress(0);
      
      if (resumeAutoSave) {
        console.log('Resuming auto-save after image upload');
        resumeAutoSave();
      }
      
      if (!success && error) {
        toast.error('Upload failed', {
          description: error.message || 'Please try again'
        });
      }
    }
  }, [resumeAutoSave]);
  
  // Update progress
  const updateProgress = useCallback((progress: number) => {
    setUploadProgress(Math.min(100, Math.max(0, progress)));
  }, []);
  
  // Clean up on unmount - ensure auto-save is resumed
  useEffect(() => {
    return () => {
      if (uploadCountRef.current > 0 && resumeAutoSave) {
        console.log('Resuming auto-save on unmount');
        resumeAutoSave();
      }
    };
  }, [resumeAutoSave]);
  
  return {
    isUploading,
    uploadProgress,
    startUpload,
    finishUpload,
    updateProgress
  };
};
