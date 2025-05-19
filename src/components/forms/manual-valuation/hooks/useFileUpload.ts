
/**
 * Changes made:
 * - Added improved file upload mechanism
 * - Added consistent temporary ID tracking
 * - Fixed storage mechanism
 * - 2025-05-21: Added enhanced upload tracking and session management
 */

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import { directUploadPhoto } from "@/services/supabase/uploadService";
import { toast } from "sonner";

interface UseFileUploadProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const useFileUpload = ({ form, onProgressUpdate }: UseFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);

  // Get or create a temp session ID for consistent storage
  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem('tempSessionId');
    if (!sessionId) {
      sessionId = `temp_${uuidv4()}`;
      localStorage.setItem('tempSessionId', sessionId);
      console.log(`Created new session ID for uploads: ${sessionId}`);
    }
    return sessionId;
  }, []);

  // Handle file upload for required photos
  const handleFileUpload = useCallback(async (file: File, type: string): Promise<string | null> => {
    if (!file) return null;
    
    setIsUploading(true);
    setUploadingFile(file.name);
    setProgress(10);
    
    if (onProgressUpdate) {
      onProgressUpdate(10);
    }
    
    try {
      console.log(`Uploading ${type} photo: ${file.name}`);
      
      // Use direct upload with temp ID
      const tempId = getSessionId();
      const publicUrl = await directUploadPhoto(file, "temp", type);
      
      setProgress(100);
      if (onProgressUpdate) {
        onProgressUpdate(100);
      }
      
      if (!publicUrl) {
        throw new Error('Upload failed - no URL returned');
      }
      
      // Success
      toast.success(`Uploaded ${type.replace('_', ' ')}`, {
        description: file.name
      });
      
      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error);
      toast.error(`Failed to upload ${type.replace('_', ' ')}`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    } finally {
      setIsUploading(false);
      setUploadingFile(null);
      setProgress(0);
      if (onProgressUpdate) {
        onProgressUpdate(0);
      }
    }
  }, [getSessionId, onProgressUpdate]);

  // Handle document upload (same mechanism but different category)
  const handleDocumentUpload = useCallback(async (file: File): Promise<string | null> => {
    return handleFileUpload(file, "service_documents");
  }, [handleFileUpload]);

  // Handle additional photos (multiple files)
  const handleAdditionalPhotos = useCallback(async (files: File[]) => {
    if (!files.length) return;
    
    setIsUploading(true);
    
    // Upload each file with progress tracking
    const totalFiles = files.length;
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        setUploadingFile(file.name);
        
        // Update progress based on current file
        const currentProgress = Math.round(((i) / totalFiles) * 100);
        setProgress(currentProgress);
        if (onProgressUpdate) {
          onProgressUpdate(currentProgress);
        }
        
        // Upload
        const url = await directUploadPhoto(file, "temp", "additional_photos");
        if (url) {
          uploadedUrls.push(url);
        }
      } catch (e) {
        console.error('Error uploading additional photo:', e);
      }
    }
    
    // Update form with all uploaded documents
    if (uploadedUrls.length > 0) {
      const existingUrls = form.watch('uploadedPhotos') || [];
      form.setValue('uploadedPhotos', [...existingUrls, ...uploadedUrls]);
      
      toast.success(`Uploaded ${uploadedUrls.length} of ${files.length} photos`);
    }
    
    // Complete progress
    setProgress(100);
    if (onProgressUpdate) {
      onProgressUpdate(100);
    }
    
    setTimeout(() => {
      setIsUploading(false);
      setUploadingFile(null);
      setProgress(0);
      if (onProgressUpdate) {
        onProgressUpdate(0);
      }
    }, 500);
  }, [form, onProgressUpdate]);

  // Handle removing an already uploaded file
  const removeUploadedFile = useCallback((fileUrl: string) => {
    const currentFiles = form.watch('serviceHistoryFiles') || [];
    const updatedFiles = currentFiles.filter(url => url !== fileUrl);
    form.setValue('serviceHistoryFiles', updatedFiles);
    
    // We can't actually delete from storage since we don't have the path,
    // but we can remove it from the form
  }, [form]);

  return {
    isUploading,
    progress,
    uploadingFile,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  };
};
