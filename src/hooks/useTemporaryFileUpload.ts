
/**
 * Hook for managing temporary file uploads
 * Created: 2025-05-02
 */

import { useState, useCallback } from 'react';
import { tempFileStorage, TempStoredFile } from '@/services/temp-storage/tempFileStorageService';
import { toast } from 'sonner';

interface UseTemporaryFileUploadProps {
  category: string;
  allowMultiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (files: TempStoredFile[]) => void;
}

export const useTemporaryFileUpload = ({
  category,
  allowMultiple = true,
  maxFiles = 10,
  onUploadComplete
}: UseTemporaryFileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<TempStoredFile[]>(
    tempFileStorage.getFilesByCategory(category)
  );

  /**
   * Handle file selection
   */
  const uploadFile = useCallback((file: File): Promise<TempStoredFile | null> => {
    return new Promise((resolve) => {
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        // Check file type
        if (!file.type.startsWith('image/')) {
          toast.error("Invalid file type", {
            description: "Please select an image file (JPG, PNG, etc.)"
          });
          resolve(null);
          return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File too large", {
            description: "Maximum file size is 10MB"
          });
          resolve(null);
          return;
        }
        
        // Store file in temp storage
        const storedFile = tempFileStorage.storeFile(file, category);
        
        // Update local state
        setFiles(tempFileStorage.getFilesByCategory(category));
        
        // Simulate progress for UX
        setProgress(100);
        
        resolve(storedFile);
      } catch (error) {
        console.error('Error storing file:', error);
        toast.error("Failed to process file");
        resolve(null);
      }
    });
  }, [category]);

  /**
   * Handle multiple file selection
   */
  const uploadFiles = useCallback(async (selectedFiles: FileList | File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);
    
    const filesToProcess = Array.from(selectedFiles);
    const availableSlots = allowMultiple 
      ? Math.max(0, maxFiles - files.length)
      : 1;
    
    if (filesToProcess.length > availableSlots) {
      toast.warning(`Only ${availableSlots} more file(s) can be uploaded`);
      // Trim the files array to only process available slots
      filesToProcess.splice(availableSlots);
    }
    
    const uploadedFiles: TempStoredFile[] = [];
    
    for (let i = 0; i < filesToProcess.length; i++) {
      // Update progress
      setProgress(Math.round((i / filesToProcess.length) * 80));
      
      const result = await uploadFile(filesToProcess[i]);
      if (result) {
        uploadedFiles.push(result);
      }
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setProgress(100);
    
    // Call the completion callback
    if (onUploadComplete && uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles);
    }
    
    setIsUploading(false);
    return uploadedFiles;
  }, [allowMultiple, maxFiles, files.length, uploadFile, onUploadComplete]);

  /**
   * Remove a file
   */
  const removeFile = useCallback((fileId: string) => {
    const removed = tempFileStorage.removeFile(fileId);
    if (removed) {
      setFiles(tempFileStorage.getFilesByCategory(category));
      return true;
    }
    return false;
  }, [category]);

  /**
   * Clear all files in this category
   */
  const clearFiles = useCallback(() => {
    tempFileStorage.clearCategory(category);
    setFiles([]);
  }, [category]);

  return {
    files,
    isUploading,
    progress,
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles,
    remainingSessionTime: tempFileStorage.getRemainingSessionTime()
  };
};
