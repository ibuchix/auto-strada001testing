
/**
 * Hook for managing required photo uploads
 * Created: 2024-09-26
 * Updated: 2025-05-20 - Enhanced with direct upload capabilities
 */

import { useState, useCallback, useEffect } from 'react';
import { allRequiredPhotos } from "../data/requiredPhotoData";
import { directUploadPhoto } from '@/services/supabase/uploadService';

interface RequiredPhotosUploadProps {
  onValidationChange?: (isValid: boolean) => void;
  carId?: string;
}

export const useRequiredPhotosUpload = ({ onValidationChange, carId = 'temp' }: RequiredPhotosUploadProps) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, boolean>>({});
  const [activeUploads, setActiveUploads] = useState<Record<string, boolean>>({});
  const [errorState, setErrorState] = useState<Record<string, string>>({});

  // Calculate completion percentage
  const getCompletionPercentage = useCallback(() => {
    const totalRequired = allRequiredPhotos.filter(photo => photo.required).length;
    if (totalRequired === 0) return 100;
    
    const completedRequired = allRequiredPhotos
      .filter(photo => photo.required && uploadedPhotos[photo.id])
      .length;
    
    return Math.round((completedRequired / totalRequired) * 100);
  }, [uploadedPhotos]);
  
  // Effect to validate photos
  useEffect(() => {
    const requiredPhotos = allRequiredPhotos.filter(photo => photo.required);
    const allRequiredUploaded = requiredPhotos.every(photo => uploadedPhotos[photo.id]);
    
    if (onValidationChange) {
      onValidationChange(allRequiredUploaded);
    }
  }, [uploadedPhotos, onValidationChange]);
  
  // Set a photo as active upload
  const setActiveUpload = useCallback((photoId: string) => {
    setActiveUploads(prev => ({ ...prev, [photoId]: true }));
    setErrorState(prev => ({ ...prev, [photoId]: '' }));
  }, []);
  
  // Handle successful upload
  const handlePhotoUploaded = useCallback((photoId: string) => {
    setActiveUploads(prev => ({ ...prev, [photoId]: false }));
    setUploadedPhotos(prev => ({ ...prev, [photoId]: true }));
    setErrorState(prev => ({ ...prev, [photoId]: '' }));
  }, []);
  
  // Handle upload errors
  const handleUploadError = useCallback((photoId: string, error: string) => {
    setActiveUploads(prev => ({ ...prev, [photoId]: false }));
    setErrorState(prev => ({ ...prev, [photoId]: error }));
  }, []);
  
  // Handle retry
  const handleUploadRetry = useCallback((photoId: string) => {
    setErrorState(prev => ({ ...prev, [photoId]: '' }));
  }, []);
  
  // Direct upload function for required photos
  const uploadRequiredPhoto = useCallback(async (file: File, photoId: string): Promise<string | null> => {
    try {
      if (!file) {
        throw new Error('No file provided');
      }
      
      setActiveUpload(photoId);
      
      // Direct upload using the service
      const publicUrl = await directUploadPhoto(file, carId, `required_${photoId}`);
      
      if (publicUrl) {
        handlePhotoUploaded(photoId);
        return publicUrl;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      handleUploadError(photoId, error instanceof Error ? error.message : 'Upload failed');
      return null;
    }
  }, [carId, setActiveUpload, handlePhotoUploaded, handleUploadError]);
  
  return {
    uploadedPhotos,
    activeUploads,
    errorState,
    setActiveUpload,
    handlePhotoUploaded,
    handleUploadError,
    handleUploadRetry,
    getCompletionPercentage,
    uploadRequiredPhoto
  };
};
