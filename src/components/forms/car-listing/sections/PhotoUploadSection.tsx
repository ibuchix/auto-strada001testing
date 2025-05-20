
/**
 * Component for uploading photos to a car listing
 * Created: 2025-05-12
 * Purpose: Handles photo upload for car listings
 * Updated: 2025-05-21 - Fixed imports for setPhotoField and updateVehiclePhotos
 * Updated: 2025-05-30 - Fixed type errors when passing form object to helper functions
 * Updated: 2025-05-31 - Refactored into smaller components for better maintainability
 */

import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { PhotoUploadContent } from './photo-upload/PhotoUploadContent';

interface PhotoUploadProps {
  carId?: string;
  onValidate?: () => Promise<boolean>;
}

export const PhotoUploadSection = ({ 
  carId, 
  onValidate 
}: PhotoUploadProps) => {
  const { form } = useFormData();
  
  return <PhotoUploadContent form={form} carId={carId} />;
};
