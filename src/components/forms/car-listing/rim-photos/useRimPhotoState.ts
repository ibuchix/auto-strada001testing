
/**
 * Hook for managing rim photo state
 * Created: 2025-05-20
 * Updated: 2025-06-25 - Fixed import for setRimPhotoField from photoHelpers
 */

import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { rimPositions } from './constants';
import { RimPhotoState } from './types';
import { setRimPhotoField } from '../utilities/photoHelpers';
import { toast } from 'sonner';

export const useRimPhotoState = (form: UseFormReturn<CarListingFormData>): [RimPhotoState, {
  handleFileUpload: (file: File, position: string) => Promise<string>;
  handlePhotoUploaded: (position: string) => void;
  handleUploadError: (position: string, errorMessage: string) => void;
  handleUploadRetry: (position: string) => void;
}] => {
  // State for tracking uploads
  const [state, setState] = useState<RimPhotoState>({
    uploadedPhotos: {},
    activeUploads: {},
    uploadErrors: {},
    uploadProgress: 0
  });

  // Load initial state from form values
  useEffect(() => {
    try {
      const formValues = form.getValues();
      const currentRimPhotos = formValues.rimPhotos || {};
      
      // Set initial state based on existing form values
      const initialUploadState: Record<string, boolean> = {};
      
      // Check each rim position for existing photos
      rimPositions.forEach(position => {
        const photoUrl = currentRimPhotos[position.id];
        initialUploadState[position.id] = !!photoUrl;
      });
      
      setState(prev => ({
        ...prev,
        uploadedPhotos: initialUploadState
      }));
    } catch (error) {
      console.error('Error initializing rim photos from form:', error);
    }
  }, [form]);

  // Handle file upload
  const handleFileUpload = async (file: File, position: string): Promise<string> => {
    try {
      // Validate inputs
      if (!file) {
        throw new Error('No file provided for upload');
      }
      
      if (!position) {
        throw new Error('No position specified for upload');
      }
      
      // Mark upload as active
      setState(prev => ({
        ...prev,
        activeUploads: { ...prev.activeUploads, [position]: true },
        uploadErrors: {
          ...prev.uploadErrors,
          [position]: undefined
        } as Record<string, string>
      }));
      
      // Simulate upload progress (in real implementation, this would track actual upload)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(progress, 90)
        }));
        if (progress >= 90) clearInterval(progressInterval);
      }, 100);
      
      // Create a preview of the image
      const reader = new FileReader();
      
      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // Update form data with image - pass the entire form object
      setRimPhotoField(position, result, form);
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setState(prev => ({ ...prev, uploadProgress: 100 }));
      
      // Mark upload as complete
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          uploadedPhotos: { ...prev.uploadedPhotos, [position]: true },
          activeUploads: {
            ...prev.activeUploads,
            [position]: undefined
          } as Record<string, boolean>,
          uploadProgress: 0
        }));
      }, 300);
      
      // Show success toast
      toast.success(`${position.replace('_', ' ')} photo uploaded`);
      
      return result;
    } catch (error) {
      console.error(`Error uploading ${position} rim photo:`, error);
      
      // Handle the error state
      setState(prev => ({
        ...prev,
        uploadErrors: { 
          ...prev.uploadErrors, 
          [position]: error instanceof Error ? error.message : 'Upload failed' 
        },
        activeUploads: {
          ...prev.activeUploads,
          [position]: undefined
        } as Record<string, boolean>
      }));
      
      // Show error toast
      toast.error(`Failed to upload ${position.replace('_', ' ')} photo`, {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  };
  
  // Handle successful upload
  const handlePhotoUploaded = (position: string) => {
    setState(prev => ({
      ...prev,
      uploadedPhotos: { ...prev.uploadedPhotos, [position]: true }
    }));
    
    // Update form field
    const rimPhotos = form.getValues().rimPhotos || {};
    form.setValue('rimPhotos', { ...rimPhotos }, { shouldDirty: true });
  };
  
  // Handle upload error
  const handleUploadError = (position: string, errorMessage: string) => {
    setState(prev => ({
      ...prev,
      uploadErrors: { ...prev.uploadErrors, [position]: errorMessage },
      activeUploads: {
        ...prev.activeUploads,
        [position]: undefined
      } as Record<string, boolean>
    }));
  };
  
  // Handle retry
  const handleUploadRetry = (position: string) => {
    // Clear the error for this position
    setState(prev => ({
      ...prev,
      uploadErrors: {
        ...prev.uploadErrors,
        [position]: undefined
      } as Record<string, string>
    }));
  };

  return [
    state,
    {
      handleFileUpload,
      handlePhotoUploaded,
      handleUploadError,
      handleUploadRetry
    }
  ];
};
