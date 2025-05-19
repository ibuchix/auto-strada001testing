/**
 * Hook for temporary file upload management
 * Created: 2025-07-18
 * Updated: 2025-08-28 - Added name field to TemporaryFile to fix type compatibility
 * Updated: 2025-05-23 - Enhanced with better error handling and finalization
 * Updated: 2025-05-19 - Integrated with global upload manager for better tracking
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { directUploadPhoto } from '@/services/supabase/uploadService';
import { supabase } from '@/integrations/supabase/client';
import { useTempFileUploadManager } from './useTempFileUploadManager';

export interface TemporaryFile {
  id: string;
  file?: File;
  name: string; // Added name field to fix type compatibility
  preview: string;
  url?: string;
}

interface UseTemporaryFileUploadOptions {
  category: string;
  allowMultiple?: boolean;
  maxFiles?: number;
  onUploadComplete?: (files: TemporaryFile[]) => void;
}

export const useTemporaryFileUpload = ({
  category,
  allowMultiple = false,
  maxFiles = 1,
  onUploadComplete
}: UseTemporaryFileUploadOptions) => {
  const [files, setFiles] = useState<TemporaryFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Use the global temp file upload manager
  const { 
    registerUpload, 
    registerCompletion, 
    registerFailure,
    getPendingCount 
  } = useTempFileUploadManager();
  
  // Track remaining session time
  const sessionStartTime = useRef(Date.now());
  const sessionDuration = useRef(30); // 30 minutes default
  
  const remainingSessionTime = useCallback(() => {
    const elapsedMinutes = (Date.now() - sessionStartTime.current) / (1000 * 60);
    return Math.max(0, sessionDuration.current - Math.floor(elapsedMinutes));
  }, []);
  
  // Function to create object URLs for previews
  const createPreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);
  
  // Upload a single file
  const uploadFile = useCallback(async (file: File): Promise<TemporaryFile | null> => {
    if (!file) {
      setError("No file provided");
      return null;
    }
    
    setIsUploading(true);
    setProgress(0);
    setError(null);
    
    // Register with the global upload manager
    const uploadId = registerUpload(file);
    
    try {
      // Generate a temporary ID
      const id = uuidv4();
      
      // Create a preview
      const preview = createPreview(file);
      
      // If not allowing multiple, remove existing files
      if (!allowMultiple) {
        // Revoke existing object URLs to prevent memory leaks
        files.forEach(file => {
          if (file.preview && file.preview.startsWith('blob:')) {
            URL.revokeObjectURL(file.preview);
          }
        });
        setFiles([]);
      }
      
      // Simulate upload progress
      let p = 0;
      const interval = setInterval(() => {
        p += 10;
        if (p <= 90) {
          setProgress(p);
        } else {
          clearInterval(interval);
        }
      }, 100);
      
      // For now, store locally until form is submitted
      const tempFile: TemporaryFile = {
        id,
        file,
        name: file.name || 'upload', // Add name property for type compatibility
        preview,
        url: '' // Initialize url as empty string for type compatibility
      };
      
      // Update state with new file
      setFiles(prevFiles => {
        const newFiles = [...prevFiles, tempFile];
        return newFiles;
      });
      
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setIsUploading(false);
        
        // Mark completed in the global manager
        registerCompletion(uploadId);
        
        // Call onUploadComplete callback if provided
        if (onUploadComplete) {
          onUploadComplete([tempFile]);
        }
      }, 1000);
      
      // Return the temporary file
      return tempFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Mark as failed in the global manager
      registerFailure(uploadId);
      
      setError(error instanceof Error ? error.message : "Upload failed");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [files, allowMultiple, createPreview, onUploadComplete, registerUpload, registerCompletion, registerFailure]);
  
  // Upload multiple files
  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    
    // Enforce max files limit
    if (files.length + filesToUpload.length > maxFiles) {
      console.warn(`Cannot upload more than ${maxFiles} files`);
      setError(`Cannot upload more than ${maxFiles} files`);
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const results: TemporaryFile[] = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Update progress
        setProgress(Math.round((i / filesToUpload.length) * 100));
        
        // Upload the file
        const result = await uploadFile(file);
        if (result) results.push(result);
      }
      
      // Call onUploadComplete callback if provided
      if (onUploadComplete && results.length > 0) {
        onUploadComplete(results);
      }
      
      return results;
    } catch (error) {
      console.error('Error uploading files:', error);
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [files.length, maxFiles, uploadFile, onUploadComplete]);
  
  // Remove a file
  const removeFile = useCallback((fileId: string): boolean => {
    const fileIndex = files.findIndex(file => file.id === fileId);
    
    if (fileIndex === -1) return false;
    
    // Revoke object URL to prevent memory leaks
    const file = files[fileIndex];
    if (file.preview && file.preview.startsWith('blob:')) {
      URL.revokeObjectURL(file.preview);
    }
    
    // Remove the file
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    
    return true;
  }, [files]);
  
  // Upload all files to storage (when form is submitted)
  const finalizeUploads = useCallback(async (carId: string): Promise<string[]> => {
    if (!carId || files.length === 0) return [];
    
    setIsUploading(true);
    setError(null);
    
    try {
      console.log(`[useTemporaryFileUpload] Finalizing ${files.length} uploads for car ${carId}`);
      
      // Get user from session
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        setError('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      const results: string[] = [];
      let completedFiles = 0;
      
      // Upload each file using direct upload
      for (const tempFile of files) {
        if (!tempFile.file) continue;
        
        try {
          // Use direct upload
          const publicUrl = await directUploadPhoto(tempFile.file, carId, category);
          
          if (publicUrl) {
            results.push(publicUrl);
          }
          
          // Update progress
          completedFiles++;
          const progress = Math.round((completedFiles / files.length) * 100);
          setProgress(progress);
        } catch (error) {
          console.error(`Error uploading file ${tempFile.name}:`, error);
        }
      }
      
      console.log(`[useTemporaryFileUpload] Successfully finalized ${results.length} of ${files.length} uploads`);
      return results;
    } catch (error) {
      console.error('[useTemporaryFileUpload] Error finalizing uploads:', error);
      setError(error instanceof Error ? error.message : "Finalization failed");
      return [];
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [files, category]);
  
  // Cleanup function (called on unmount)
  const cleanup = useCallback(() => {
    // Revoke all object URLs
    files.forEach(file => {
      if (file.preview && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview);
      }
    });
  }, [files]);
  
  // Automatically clean up on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  
  // Create a verification function that can be used by the submit button
  const verifyUploads = useCallback(async (): Promise<boolean> => {
    // Check with the global manager if there are any pending uploads
    const pendingCount = getPendingCount();
    
    console.log(`[useTemporaryFileUpload] Verifying uploads, ${pendingCount} pending`);
    
    // If there are no pending uploads, we're good to go
    if (pendingCount === 0) {
      return true;
    }
    
    // Otherwise, need to wait for uploads to complete
    return false;
  }, [getPendingCount]);
  
  return {
    files,
    isUploading,
    progress,
    error,
    remainingSessionTime: remainingSessionTime(),
    uploadFile,
    uploadFiles,
    removeFile,
    finalizeUploads,
    verifyUploads,
    cleanup
  };
};
