
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors
 * - 2024-03-26: Updated to use the correct Supabase storage method
 * - 2024-03-26: Added proper typing for dropzone integration
 * - 2024-08-09: Enhanced to use organized Supabase Storage with categorized structure
 * - 2024-08-17: Refactored into smaller files for better maintainability
 * - 2025-05-07: Added diagnosticId prop and exposed uploadFile and resetUploadState
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadPhoto } from './services/photoStorageService';

export interface UsePhotoUploadProps {
  carId?: string;
  category?: string;
  onProgressUpdate?: (progress: number) => void;
  diagnosticId?: string; // Added diagnosticId
}

export const usePhotoUpload = ({ 
  carId, 
  category = 'general', 
  onProgressUpdate,
  diagnosticId 
}: UsePhotoUploadProps = {}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Log diagnostic information
  const logDiagnostic = (event: string, data: any = {}) => {
    if (diagnosticId) {
      console.log(`[${diagnosticId}] [usePhotoUpload] ${event}:`, {
        ...data,
        timestamp: new Date().toISOString(),
        carId
      });
    }
  };

  const resetUploadState = () => {
    logDiagnostic('resetUploadState called');
    setUploadProgress(0);
    setIsUploading(false);
  };

  const uploadFile = async (file: File, uploadPath: string): Promise<string | null> => {
    if (!file) {
      logDiagnostic('uploadFile called with null file', { uploadPath });
      return null;
    }

    logDiagnostic('uploadFile started', { 
      fileName: file.name, 
      fileSize: file.size, 
      uploadPath 
    });
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload the file and get the URL
      const result = await uploadPhoto(file, carId || 'temp', category);
      
      // Update progress
      setUploadProgress(100);
      if (onProgressUpdate) {
        onProgressUpdate(100);
      }
      
      logDiagnostic('uploadFile completed', { result });
      return result;
    } catch (error: any) {
      logDiagnostic('uploadFile error', { error: error.message });
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!carId) {
      toast.error("Car ID is required to upload photos.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = acceptedFiles.length;
      let completedFiles = 0;
      
      const uploadPromises = acceptedFiles.map(async (file) => {
        const result = await uploadPhoto(file, carId, category);
        
        // Update progress
        completedFiles++;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        setUploadProgress(newProgress);
        if (onProgressUpdate) {
          onProgressUpdate(newProgress);
        }
        
        return result;
      });

      const results = await Promise.all(uploadPromises);
      setUploadedPhotos(prevPhotos => [...prevPhotos, ...results.filter(Boolean) as string[]]);
      toast.success("Photos uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast.error(error.message || "Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  }, [carId, category, onProgressUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp']
    },
    maxFiles: 10,
    disabled: isUploading
  });

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isUploading,
    uploadProgress,
    uploadedPhotos,
    setUploadedPhotos,
    uploadFile,    // Expose the uploadFile function
    resetUploadState  // Expose the resetUploadState function
  };
};
