
/**
 * Hook for temporary file upload management
 * Created: 2025-07-18
 */
import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { uploadImagesForCar } from '@/services/supabase/uploadService';
import { supabase } from '@/integrations/supabase/client';

export interface TemporaryFile {
  id: string;
  file?: File;
  preview: string;
  url?: string;
}

interface UseTemporaryFileUploadOptions {
  category: string;
  allowMultiple?: boolean;
  maxFiles?: number;
}

export const useTemporaryFileUpload = ({
  category,
  allowMultiple = false,
  maxFiles = 1
}: UseTemporaryFileUploadOptions) => {
  const [files, setFiles] = useState<TemporaryFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
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
    if (!file) return null;
    
    setIsUploading(true);
    setProgress(0);
    
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
        preview,
      };
      
      setFiles(prevFiles => [...prevFiles, tempFile]);
      setProgress(100);
      
      // Return the temporary file
      return tempFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [files, allowMultiple, createPreview]);
  
  // Upload multiple files
  const uploadFiles = useCallback(async (fileList: FileList | File[]) => {
    const filesToUpload = Array.from(fileList);
    
    // Enforce max files limit
    if (files.length + filesToUpload.length > maxFiles) {
      console.warn(`Cannot upload more than ${maxFiles} files`);
      return;
    }
    
    setIsUploading(true);
    
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
      
      return results;
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [files.length, maxFiles, uploadFile]);
  
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
    
    try {
      // Get user from session
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Upload all files using the uploadImagesForCar service
      const filesToUpload = files
        .filter(file => file.file) // Only upload files that have a File object
        .map(file => file.file!);
      
      // Upload the files
      const uploadedPaths = await uploadImagesForCar(filesToUpload, carId, category, userId);
      
      // Get public URLs
      const publicUrls = uploadedPaths.map(path => {
        const { data } = supabase.storage
          .from('car-images')
          .getPublicUrl(path);
        return data.publicUrl;
      });
      
      return publicUrls;
    } catch (error) {
      console.error('Error finalizing uploads:', error);
      return [];
    } finally {
      setIsUploading(false);
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
  
  return {
    files,
    isUploading,
    progress,
    remainingSessionTime: remainingSessionTime(),
    uploadFile,
    uploadFiles,
    removeFile,
    finalizeUploads,
    cleanup
  };
};
