
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors
 * - 2024-03-26: Updated to use the correct Supabase storage method
 * - 2024-03-26: Added proper typing for dropzone integration
 * - 2024-08-09: Enhanced to use organized Supabase Storage with categorized structure
 * - 2024-08-17: Refactored into smaller files for better maintainability
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { uploadPhoto } from './services/photoStorageService';

export interface UsePhotoUploadProps {
  carId?: string;
  category?: string;
  onProgressUpdate?: (progress: number) => void;
}

export const usePhotoUpload = ({ carId, category = 'general', onProgressUpdate }: UsePhotoUploadProps = {}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setUploadedPhotos
  };
};
