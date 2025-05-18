
/**
 * Hook for temporary file upload management
 * Created: 2025-07-18
 * Updated: 2025-08-28 - Added name field to TemporaryFile to fix type compatibility
 * Updated: 2025-05-23 - Enhanced with better error handling and finalization
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uploadImagesForCar } from '@/services/supabase/uploadService';
import { supabase } from '@/integrations/supabase/client';

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
      
      // For now, store locally until form is submitted
      const tempFile: TemporaryFile = {
        id,
        file,
        name: file.name || 'upload', // Add name property for type compatibility
        preview,
        url: '' // Initialize url as empty string for type compatibility
      };
      
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
      
      // Update state with new file
      setFiles(prevFiles => {
        const newFiles = [...prevFiles, tempFile];
        return newFiles;
      });
      
      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        setIsUploading(false);
        
        // Call onUploadComplete callback if provided
        if (onUploadComplete) {
          onUploadComplete([tempFile]);
        }
      }, 1000);
      
      // Return the temporary file
      return tempFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : "Upload failed");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [files, allowMultiple, createPreview, onUploadComplete]);
  
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
      // Get user from session
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        setError('User not authenticated');
        throw new Error('User not authenticated');
      }
      
      // Upload all files using the uploadImagesForCar service
      const filesToUpload = files
        .filter(file => file.file) // Only upload files that have a File object
        .map(file => file.file!);
      
      // Use real progress if possible
      let pct = 0;
      const interval = setInterval(() => {
        pct = Math.min(pct + 5, 90);
        setProgress(pct);
      }, 200);
      
      // Upload the files
      console.log(`Finalizing ${filesToUpload.length} uploads for car ${carId}`);
      const uploadedPaths = await uploadImagesForCar(filesToUpload, carId, category, userId);
      
      // Complete progress
      clearInterval(interval);
      setProgress(100);
      
      // Get public URLs
      const publicUrls = uploadedPaths.map(path => {
        const { data } = supabase.storage
          .from('car-images')
          .getPublicUrl(path);
        return data.publicUrl;
      });
      
      console.log(`Successfully finalized ${publicUrls.length} uploads`);
      return publicUrls;
    } catch (error) {
      console.error('Error finalizing uploads:', error);
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
    cleanup
  };
};
