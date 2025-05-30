
/**
 * Hook for managing photo upload state
 * Updated: 2025-05-30 - Phase 4: Fixed to preserve File objects alongside preview URLs
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

export interface PhotoFile {
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

export interface PhotoUploadState {
  state: {
    validationError: string | null;
    setValidationError: React.Dispatch<React.SetStateAction<string | null>>;
    validated: boolean;
    setValidated: React.Dispatch<React.SetStateAction<boolean>>;
    uploadProgress: number;
    setUploadProgress: React.Dispatch<React.SetStateAction<number>>;
    isUploading: boolean;
    setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
    allRequiredUploaded: boolean;
  };
  files: {
    frontView: PhotoFile[];
    rearView: PhotoFile[];
    driverSide: PhotoFile[];
    passengerSide: PhotoFile[];
    dashboard: PhotoFile[];
    interiorFront: PhotoFile[];
    interiorRear: PhotoFile[];
    additionalPhotos: PhotoFile[];
  };
  setters: {
    setFrontView: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
    setRearView: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
    setDriverSide: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
    setPassengerSide: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
    setDashboard: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
    setInteriorFront: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
    setInteriorRear: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
    setAdditionalPhotos: React.Dispatch<React.SetStateAction<PhotoFile[]>>;
  };
}

export interface UsePhotoUploadStateProps {
  form: UseFormReturn<CarListingFormData>;
}

export const usePhotoUploadState = ({ form }: UsePhotoUploadStateProps): PhotoUploadState => {
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [validated, setValidated] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  
  // Individual photo file states - preserving File objects
  const [frontView, setFrontView] = React.useState<PhotoFile[]>([]);
  const [rearView, setRearView] = React.useState<PhotoFile[]>([]);
  const [driverSide, setDriverSide] = React.useState<PhotoFile[]>([]);
  const [passengerSide, setPassengerSide] = React.useState<PhotoFile[]>([]);
  const [dashboard, setDashboard] = React.useState<PhotoFile[]>([]);
  const [interiorFront, setInteriorFront] = React.useState<PhotoFile[]>([]);
  const [interiorRear, setInteriorRear] = React.useState<PhotoFile[]>([]);
  const [additionalPhotos, setAdditionalPhotos] = React.useState<PhotoFile[]>([]);
  
  // Check if all required photos are uploaded
  const allRequiredUploaded = React.useMemo(() => {
    return frontView.length > 0 &&
      rearView.length > 0 &&
      driverSide.length > 0 &&
      passengerSide.length > 0 &&
      dashboard.length > 0 &&
      interiorFront.length > 0 &&
      interiorRear.length > 0;
  }, [frontView, rearView, driverSide, passengerSide, dashboard, interiorFront, interiorRear]);
  
  // Update form whenever files change
  React.useEffect(() => {
    const requiredPhotos: Record<string, File | string> = {};
    const additionalFiles: File[] = [];
    
    // Collect required photos as File objects (not blob URLs)
    if (frontView.length > 0) requiredPhotos.exterior_front = frontView[0].file;
    if (rearView.length > 0) requiredPhotos.exterior_rear = rearView[0].file;
    if (driverSide.length > 0) requiredPhotos.exterior_left = driverSide[0].file;
    if (passengerSide.length > 0) requiredPhotos.exterior_right = passengerSide[0].file;
    if (dashboard.length > 0) requiredPhotos.dashboard = dashboard[0].file;
    if (interiorFront.length > 0) requiredPhotos.interior_front = interiorFront[0].file;
    if (interiorRear.length > 0) requiredPhotos.interior_rear = interiorRear[0].file;
    
    // Collect additional photos as File objects
    additionalPhotos.forEach(photo => {
      additionalFiles.push(photo.file);
    });
    
    // Update form with File objects, not blob URLs
    form.setValue('requiredPhotos', requiredPhotos, { shouldDirty: true });
    form.setValue('additionalPhotos', additionalFiles, { shouldDirty: true });
    form.setValue('requiredPhotosComplete', allRequiredUploaded, { shouldDirty: true });
    
    console.log('Updated form with File objects:', {
      requiredPhotosCount: Object.keys(requiredPhotos).length,
      additionalPhotosCount: additionalFiles.length,
      allRequiredUploaded
    });
  }, [form, frontView, rearView, driverSide, passengerSide, dashboard, interiorFront, interiorRear, additionalPhotos, allRequiredUploaded]);
  
  return {
    state: {
      validationError,
      setValidationError,
      validated,
      setValidated,
      uploadProgress,
      setUploadProgress,
      isUploading,
      setIsUploading,
      allRequiredUploaded
    },
    files: {
      frontView,
      rearView,
      driverSide,
      passengerSide,
      dashboard,
      interiorFront,
      interiorRear,
      additionalPhotos
    },
    setters: {
      setFrontView,
      setRearView,
      setDriverSide,
      setPassengerSide,
      setDashboard,
      setInteriorFront,
      setInteriorRear,
      setAdditionalPhotos
    }
  };
};
