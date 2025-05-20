
/**
 * Hook for photo upload handlers
 * Created: 2025-05-20
 * Updated: 2025-05-21 - Fixed type issue with PhotoUploadState
 * Updated: 2025-06-25 - Fixed variable reference for interiorRear and function calls
 * Updated: 2025-06-26 - Fixed TypeScript issues and updated updateVehiclePhotos usage
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { setPhotoField, updateVehiclePhotos } from '../../../utilities/photoHelpers';

// Import the proper types from usePhotoUploadState
interface UsePhotoUploadHandlersProps {
  form: UseFormReturn<CarListingFormData>;
  state: {
    validationError: string | null;
    setValidationError: React.Dispatch<React.SetStateAction<string | null>>;
    validated: boolean;
    setValidated: React.Dispatch<React.SetStateAction<boolean>>;
    uploadedPhotos: string[];
    setUploadedPhotos: React.Dispatch<React.SetStateAction<string[]>>;
    selectedFiles: File[];
    setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
    uploadProgress: number;
    setUploadProgress: React.Dispatch<React.SetStateAction<number>>;
    isUploading: boolean;
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
    allRequiredUploaded: boolean;
  };
  uploaders: {
    frontView: any;
    rearView: any;
    driverSide: any;
    passengerSide: any;
    dashboard: any;
    interiorFront: any;
    interiorRear: any;
    additionalPhotos: any;
  };
}

export const usePhotoUploadHandlers = ({ 
  form, 
  state, 
  uploaders 
}: UsePhotoUploadHandlersProps) => {
  
  // Handle file upload
  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    state.setSelectedFiles(fileArray);
    state.setIsUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      state.setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        state.setIsUploading(false);
        
        // Add uploaded photos
        const urls = fileArray.map(() => URL.createObjectURL(new Blob()));
        state.setUploadedPhotos(prev => [...prev, ...urls]);
        state.setSelectedFiles([]);
      }
    }, 300);
  };
  
  // Remove a photo
  const removePhoto = (index: number) => {
    state.setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Update form with photo urls
  React.useEffect(() => {
    // Update form value
    form.setValue('requiredPhotosComplete', state.allRequiredUploaded, { shouldDirty: true });
    
    // Collect all URLs for form submission
    const photoArray: string[] = [
      ...(uploaders.frontView.files.length > 0 ? [(uploaders.frontView.files[0].preview || '')] : []),
      ...(uploaders.rearView.files.length > 0 ? [(uploaders.rearView.files[0].preview || '')] : []),
      ...(uploaders.driverSide.files.length > 0 ? [(uploaders.driverSide.files[0].preview || '')] : []),
      ...(uploaders.passengerSide.files.length > 0 ? [(uploaders.passengerSide.files[0].preview || '')] : []),
      ...(uploaders.dashboard.files.length > 0 ? [(uploaders.dashboard.files[0].preview || '')] : []),
      ...(uploaders.interiorFront.files.length > 0 ? [(uploaders.interiorFront.files[0].preview || '')] : []),
      ...(uploaders.interiorRear.files.length > 0 ? [(uploaders.interiorRear.files[0].preview || '')] : []),
      ...(uploaders.additionalPhotos.files.map(f => f.preview || ''))
    ];
    
    // Update form with photo array
    form.setValue('uploadedPhotos', photoArray, { shouldDirty: true });
    
    // Create a photo updates object for the updateVehiclePhotos function
    const photoUpdates: Record<string, string> = {};
    
    // Set individual photo fields and build the photoUpdates object
    if (uploaders.frontView.files.length > 0) {
      const value = uploaders.frontView.files[0].preview || '';
      setPhotoField('frontView', value, form);
      photoUpdates.frontView = value;
    }
    
    if (uploaders.rearView.files.length > 0) {
      const value = uploaders.rearView.files[0].preview || '';
      setPhotoField('rearView', value, form);
      photoUpdates.rearView = value;
    }
    
    if (uploaders.driverSide.files.length > 0) {
      const value = uploaders.driverSide.files[0].preview || '';
      setPhotoField('driverSide', value, form);
      photoUpdates.driverSide = value;
    }
    
    if (uploaders.passengerSide.files.length > 0) {
      const value = uploaders.passengerSide.files[0].preview || '';
      setPhotoField('passengerSide', value, form);
      photoUpdates.passengerSide = value;
    }
    
    if (uploaders.dashboard.files.length > 0) {
      const value = uploaders.dashboard.files[0].preview || '';
      setPhotoField('dashboard', value, form);
      photoUpdates.dashboard = value;
    }
    
    if (uploaders.interiorFront.files.length > 0) {
      const value = uploaders.interiorFront.files[0].preview || '';
      setPhotoField('interiorFront', value, form);
      photoUpdates.interiorFront = value;
    }
    
    if (uploaders.interiorRear.files.length > 0) {
      const value = uploaders.interiorRear.files[0].preview || '';
      setPhotoField('interiorRear', value, form);
      photoUpdates.interiorRear = value;
    }
    
    // Update vehicle photos object with the collected updates if there are any
    if (Object.keys(photoUpdates).length > 0) {
      updateVehiclePhotos(form, photoUpdates);
    }
    
    if (state.allRequiredUploaded) {
      state.setValidationError(null);
      state.setValidated(true);
    } else {
      state.setValidated(false);
    }
  }, [
    state.allRequiredUploaded,
    form,
    uploaders.frontView.files,
    uploaders.rearView.files,
    uploaders.driverSide.files,
    uploaders.passengerSide.files,
    uploaders.dashboard.files,
    uploaders.interiorFront.files,
    uploaders.interiorRear.files,
    uploaders.additionalPhotos.files
  ]);
  
  return {
    handleUpload,
    removePhoto
  };
};
