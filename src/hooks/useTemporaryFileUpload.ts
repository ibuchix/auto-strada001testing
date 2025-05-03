
/**
 * Temporary File Upload Hook
 * Created: 2025-06-17
 * 
 * Custom hook for temporary file uploads with preview
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { TemporaryFile } from '@/types/forms';

interface UseTemporaryFileUploadOptions {
  category: string;
  allowMultiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  onUploadComplete?: (files: TemporaryFile[]) => void;
  onUploadError?: (error: Error) => void;
}

export const useTemporaryFileUpload = (options: UseTemporaryFileUploadOptions) => {
  const {
    category,
    allowMultiple = false,
    maxFiles = 10,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
    onUploadComplete,
    onUploadError
  } = options;

  const [files, setFiles] = useState<TemporaryFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  // Upload a single file
  const uploadFile = useCallback(async (file: File): Promise<TemporaryFile | null> => {
    if (!allowMultiple && files.length > 0) {
      // Remove existing file if only one is allowed
      files.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });
      setFiles([]);
    }

    // Check file size
    if (file.size > maxFileSize) {
      const error = new Error(`File size exceeds the limit (${maxFileSize / 1024 / 1024}MB)`);
      setError(error);
      toast.error(`File too large (max ${maxFileSize / 1024 / 1024}MB)`);
      if (onUploadError) onUploadError(error);
      return null;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      const error = new Error(`Unsupported file type: ${file.type}`);
      setError(error);
      toast.error('Unsupported file type');
      if (onUploadError) onUploadError(error);
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i < 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setProgress(i);
      }

      // Create a temporary file object with preview URL
      const newFile: TemporaryFile = {
        id: `${category}-${uuidv4()}`,
        file,
        url: URL.createObjectURL(file),
        preview: URL.createObjectURL(file),
        uploaded: true,
        uploadedAt: new Date()
      };

      setProgress(100);

      // Add the new file to the list
      setFiles(prev => [...prev, newFile]);

      // Call the onUploadComplete callback
      if (onUploadComplete) {
        onUploadComplete([newFile]);
      }

      return newFile;
    } catch (e) {
      const error = e as Error;
      setError(error);
      if (onUploadError) onUploadError(error);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [
    files,
    category,
    allowMultiple,
    maxFileSize,
    allowedTypes,
    onUploadComplete,
    onUploadError
  ]);

  // Upload multiple files
  const uploadFiles = useCallback(async (fileList: FileList | File[]): Promise<TemporaryFile[]> => {
    const filesToUpload = Array.from(fileList).slice(0, maxFiles - files.length);
    
    if (filesToUpload.length === 0) {
      toast.info(`Maximum ${maxFiles} files allowed`);
      return [];
    }

    setIsUploading(true);
    setProgress(0);

    const uploadedFiles: TemporaryFile[] = [];
    let errorCount = 0;

    try {
      // Process each file
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Update progress
        setProgress(Math.round((i / filesToUpload.length) * 100));

        // Check file size
        if (file.size > maxFileSize) {
          errorCount++;
          continue;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
          errorCount++;
          continue;
        }

        // Create temporary file object with preview URL
        const newFile: TemporaryFile = {
          id: `${category}-${uuidv4()}`,
          file,
          url: URL.createObjectURL(file),
          preview: URL.createObjectURL(file),
          uploaded: true,
          uploadedAt: new Date()
        };

        uploadedFiles.push(newFile);
      }

      // Add new files to state
      if (!allowMultiple) {
        // Remove existing files if only one is allowed
        files.forEach(f => {
          if (f.preview) {
            URL.revokeObjectURL(f.preview);
          }
        });
        setFiles(uploadedFiles);
      } else {
        setFiles(prev => [...prev, ...uploadedFiles]);
      }

      // Call upload complete callback
      if (uploadedFiles.length > 0 && onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }

      return uploadedFiles;
    } catch (e) {
      const error = e as Error;
      setError(error);
      if (onUploadError) onUploadError(error);
      return [];
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [
    files,
    maxFiles,
    category,
    allowMultiple,
    maxFileSize,
    allowedTypes,
    onUploadComplete,
    onUploadError
  ]);

  // Remove a file
  const removeFile = useCallback((fileId: string): boolean => {
    const fileToRemove = files.find(f => f.id === fileId);
    
    if (!fileToRemove) {
      return false;
    }

    // Revoke object URL to prevent memory leaks
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    if (fileToRemove.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }

    // Remove file from state
    setFiles(prev => prev.filter(f => f.id !== fileId));
    return true;
  }, [files]);

  // Clear all files
  const clearFiles = useCallback(() => {
    // Revoke all object URLs
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      if (file.url) {
        URL.revokeObjectURL(file.url);
      }
    });
    
    setFiles([]);
  }, [files]);

  return {
    files,
    isUploading,
    progress,
    error,
    uploadFile,
    uploadFiles,
    removeFile,
    clearFiles,
    setProgress
  };
};
