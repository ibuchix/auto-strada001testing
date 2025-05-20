
/**
 * Hook for managing photo upload state
 * Created: 2025-05-20
 */

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { useTemporaryFileUpload } from '@/hooks/useTemporaryFileUpload';
import { adaptTemporaryFileUploader } from '../../../utilities/photoHelpers';

export interface PhotoUploadState {
  validationError: string | null;
  validated: boolean;
  uploadedPhotos: string[];
  selectedFiles: File[];
  uploadProgress: number;
  isUploading: boolean;
  allRequiredUploaded: boolean;
  uploaders: {
    frontView: ReturnType<typeof useTemporaryFileUpload>;
    rearView: ReturnType<typeof useTemporaryFileUpload>;
    driverSide: ReturnType<typeof useTemporaryFileUpload>;
    passengerSide: ReturnType<typeof useTemporaryFileUpload>;
    dashboard: ReturnType<typeof useTemporaryFileUpload>;
    interiorFront: ReturnType<typeof useTemporaryFileUpload>;
    interiorRear: ReturnType<typeof useTemporaryFileUpload>;
    additionalPhotos: ReturnType<typeof useTemporaryFileUpload>;
  };
}

export interface UsePhotoUploadStateProps {
  form: UseFormReturn<CarListingFormData>;
}

export const usePhotoUploadState = ({ form }: UsePhotoUploadStateProps) => {
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [validated, setValidated] = React.useState(false);
  const [uploadedPhotos, setUploadedPhotos] = React.useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  
  // Get photo upload state from the hook for each required photo
  const frontView = useTemporaryFileUpload({
    category: 'required_front_view',
    allowMultiple: false
  });
  
  const rearView = useTemporaryFileUpload({
    category: 'required_rear_view',
    allowMultiple: false
  });
  
  const driverSide = useTemporaryFileUpload({
    category: 'required_driver_side',
    allowMultiple: false
  });
  
  const passengerSide = useTemporaryFileUpload({
    category: 'required_passenger_side',
    allowMultiple: false
  });
  
  const dashboard = useTemporaryFileUpload({
    category: 'required_dashboard',
    allowMultiple: false
  });
  
  const interiorFront = useTemporaryFileUpload({
    category: 'required_interior_front',
    allowMultiple: false
  });
  
  const interiorRear = useTemporaryFileUpload({
    category: 'required_interior_rear',
    allowMultiple: false
  });
  
  const additionalPhotos = useTemporaryFileUpload({
    category: 'additional_photos',
    allowMultiple: true,
    maxFiles: 10
  });
  
  // Check if all required photos are uploaded
  const allRequiredUploaded = React.useMemo(() => {
    return frontView.files.length > 0 &&
      rearView.files.length > 0 &&
      driverSide.files.length > 0 &&
      passengerSide.files.length > 0 &&
      dashboard.files.length > 0 &&
      interiorFront.files.length > 0 &&
      interiorRear.files.length > 0;
  }, [
    frontView.files, 
    rearView.files, 
    driverSide.files, 
    passengerSide.files, 
    dashboard.files, 
    interiorFront.files, 
    interiorRear.files
  ]);
  
  return {
    state: {
      validationError,
      setValidationError,
      validated,
      setValidated,
      uploadedPhotos,
      setUploadedPhotos,
      selectedFiles,
      setSelectedFiles,
      uploadProgress,
      setUploadProgress,
      isUploading,
      setIsUploading,
      allRequiredUploaded
    },
    uploaders: {
      frontView,
      rearView,
      driverSide,
      passengerSide,
      dashboard,
      interiorFront,
      interiorRear,
      additionalPhotos
    }
  };
};
