
/**
 * Temporary File Upload Hook
 * Created: 2025-06-18
 * Updated: 2025-06-20 - Fixed type compatibility with TempStoredFile
 * Updated: 2025-05-08 - Updated to use proper types from forms.ts
 * 
 * Hook for managing temporary file uploads during form completion
 */

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from 'uuid';
import { tempFileStorage } from "@/services/temp-storage/tempFileStorageService";
import { TempStoredFile, TemporaryFile } from "@/types/forms";

// Updated interface to support all needed options
export interface UseTemporaryFileUploadOptions {
  category: string;
  allowMultiple: boolean;
  maxFiles?: number;
  // Added for backwards compatibility
  accept?: Record<string, string[]>;
}

export const useTemporaryFileUpload = ({ 
  category,
  allowMultiple = false,
  maxFiles = 10
}: UseTemporaryFileUploadOptions) => {
  const [files, setFiles] = useState<TemporaryFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  
  // Get remaining session time
  const remainingSessionTime = tempFileStorage.getRemainingSessionTime ? 
    tempFileStorage.getRemainingSessionTime() : 
    30; // Default to 30 minutes if method not available
  
  // Function to upload a single file
  const uploadFile = useCallback(async (file: File): Promise<TemporaryFile | null> => {
    try {
      setIsUploading(true);
      setProgress(10);
      setError(null);
      
      // Create a temporary URL for preview
      const previewUrl = URL.createObjectURL(file);
      
      // Simulate upload progress (for better UX)
      const progressTimer = setTimeout(() => setProgress(50), 300);
      
      // Add to temporary storage - simulate storage if not available
      let storedFile: { id: string, file: File, url: string };
      
      if (tempFileStorage.uploadFile) {
        storedFile = await tempFileStorage.uploadFile(file, category);
      } else {
        // Fallback if the method isn't available
        storedFile = {
          id: uuidv4(),
          file,
          url: previewUrl
        };
      }
      
      // Clear the progress timer
      clearTimeout(progressTimer);
      setProgress(100);
      
      // Create the temporary file object
      const tempFile: TemporaryFile = {
        id: storedFile.id,
        file: storedFile.file,
        url: storedFile.url,
        preview: previewUrl,
        uploaded: true,
        uploadedAt: new Date(),
        category: category,
        createdAt: new Date()
      };
      
      // Add to state
      if (allowMultiple) {
        setFiles(prev => [...prev, tempFile]);
      } else {
        // If not allowing multiple, replace existing file
        setFiles([tempFile]);
      }
      
      return tempFile;
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err : new Error('Failed to upload file'));
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [category, allowMultiple]);
  
  // Function to upload multiple files
  const uploadFiles = useCallback(async (fileList: FileList | File[]): Promise<TemporaryFile[]> => {
    try {
      setIsUploading(true);
      setError(null);
      
      // Convert FileList to array
      const filesToUpload = Array.from(fileList);
      
      // Limit to max files
      const filesToProcess = allowMultiple 
        ? filesToUpload.slice(0, maxFiles - files.length) 
        : filesToUpload.slice(0, 1);
      
      if (filesToProcess.length === 0) {
        return [];
      }
      
      // Upload each file
      const uploadedFiles: TemporaryFile[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        // Update progress
        setProgress(Math.round((i / filesToProcess.length) * 100));
        
        // Upload file
        const uploadedFile = await uploadFile(filesToProcess[i]);
        if (uploadedFile) {
          uploadedFiles.push(uploadedFile);
        }
      }
      
      return uploadedFiles;
    } catch (err: any) {
      console.error('Error uploading files:', err);
      setError(err instanceof Error ? err : new Error('Failed to upload files'));
      return [];
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [uploadFile, files.length, allowMultiple, maxFiles]);
  
  // Function to remove a file
  const removeFile = useCallback((fileId: string): boolean => {
    const fileToRemove = files.find(f => f.id === fileId);
    
    if (fileToRemove) {
      // Remove from temporary storage if method exists
      if (tempFileStorage.removeFile) {
        tempFileStorage.removeFile(fileId);
      }
      
      // Revoke object URL
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      
      // Remove from state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      
      return true;
    }
    
    return false;
  }, [files]);
  
  // Function to clear all files
  const clearFiles = useCallback(() => {
    // Revoke all object URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    // Clear state
    setFiles([]);
    
    // Note: We don't clear from tempFileStorage here as other components might use those files
  }, [files]);
  
  // Adapter method to convert TemporaryFile[] to TempStoredFile[]
  const getStoredFiles = useCallback((): TempStoredFile[] => {
    return files.map(file => ({
      id: file.id,
      file: file.file,
      category: file.category || category,
      url: file.url,
      createdAt: file.createdAt || new Date(),
      preview: file.preview,
      uploaded: file.uploaded,
      uploadedAt: file.uploadedAt.toISOString(),
      name: file.file.name,
      size: file.file.size,
      type: file.file.type
    }));
  }, [files, category]);
  
  return {
    files,
    storedFiles: getStoredFiles(),
    isUploading,
    progress,
    error,
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles,
    setProgress,
    remainingSessionTime
  };
};
