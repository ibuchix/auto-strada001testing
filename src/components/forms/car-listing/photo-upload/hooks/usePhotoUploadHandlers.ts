
/**
 * Hook for photo upload handlers
 * Updated: 2025-05-30 - Phase 4: Fixed to work with preserved File objects
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { PhotoUploadState, PhotoFile } from './usePhotoUploadState';

interface UsePhotoUploadHandlersProps {
  form: UseFormReturn<CarListingFormData>;
  uploadState: PhotoUploadState;
}

export const usePhotoUploadHandlers = ({ form, uploadState }: UsePhotoUploadHandlersProps) => {
  const { state, files, setters } = uploadState;
  
  // Helper to create PhotoFile from File
  const createPhotoFile = (file: File): PhotoFile => ({
    file,
    preview: URL.createObjectURL(file),
    uploaded: false
  });
  
  // Handle single photo upload for required photos
  const handleSinglePhotoUpload = (file: File, photoType: keyof typeof setters) => {
    if (photoType === 'setAdditionalPhotos') return; // Additional photos handled separately
    
    const photoFile = createPhotoFile(file);
    const setter = setters[photoType];
    
    if (setter) {
      setter([photoFile]);
      console.log(`Updated ${photoType} with File object:`, file.name);
    }
  };
  
  // Handle multiple photo upload for additional photos
  const handleMultiplePhotoUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const photoFiles = fileArray.map(createPhotoFile);
    
    setters.setAdditionalPhotos(prev => [...prev, ...photoFiles]);
    console.log('Added additional photos:', fileArray.map(f => f.name));
  };
  
  // Remove a photo
  const removePhoto = (photoType: keyof typeof setters, index: number = 0) => {
    const setter = setters[photoType];
    const currentFiles = files[photoType.replace('set', '').toLowerCase() as keyof typeof files] as PhotoFile[];
    
    if (setter && currentFiles[index]) {
      // Revoke the blob URL to prevent memory leaks
      URL.revokeObjectURL(currentFiles[index].preview);
      
      if (photoType === 'setAdditionalPhotos') {
        setter(prev => prev.filter((_, i) => i !== index));
      } else {
        setter([]);
      }
      
      console.log(`Removed photo from ${photoType} at index ${index}`);
    }
  };
  
  // Clean up blob URLs on unmount
  React.useEffect(() => {
    return () => {
      Object.values(files).flat().forEach(photoFile => {
        if (photoFile.preview) {
          URL.revokeObjectURL(photoFile.preview);
        }
      });
    };
  }, []);
  
  return {
    handleSinglePhotoUpload,
    handleMultiplePhotoUpload,
    removePhoto,
    createPhotoFile
  };
};
