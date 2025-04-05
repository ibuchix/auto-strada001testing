
/**
 * Hook for validating required photos in the car listing form
 * Ensures all required photos are uploaded before proceeding
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { allRequiredPhotos } from '../data/requiredPhotoData';

interface UsePhotoValidationProps {
  uploadedPhotos: Record<string, boolean>;
  onValidationChange?: (isValid: boolean) => void;
}

export const usePhotoValidation = ({ 
  uploadedPhotos, 
  onValidationChange 
}: UsePhotoValidationProps) => {
  const [isValid, setIsValid] = useState(false);
  const [missingPhotos, setMissingPhotos] = useState<string[]>([]);

  // Validate if all required photos are uploaded
  useEffect(() => {
    const requiredPhotoIds = allRequiredPhotos.map(photo => photo.id);
    const missingPhotoIds = requiredPhotoIds.filter(id => !uploadedPhotos[id]);
    
    setMissingPhotos(missingPhotoIds);
    const valid = missingPhotoIds.length === 0;
    setIsValid(valid);
    
    if (onValidationChange) {
      onValidationChange(valid);
    }
  }, [uploadedPhotos, onValidationChange]);

  // Get missing photo titles for user-friendly messaging
  const getMissingPhotoTitles = useCallback(() => {
    return missingPhotos.map(id => {
      const photo = allRequiredPhotos.find(p => p.id === id);
      return photo ? photo.title : id;
    });
  }, [missingPhotos]);

  // Validate and show feedback to the user
  const validatePhotos = useCallback((): boolean => {
    if (isValid) {
      return true;
    }
    
    const missingTitles = getMissingPhotoTitles();
    
    toast.error('Missing required photos', {
      description: `Please upload the following photos: ${missingTitles.join(', ')}`,
      duration: 5000
    });
    
    return false;
  }, [isValid, getMissingPhotoTitles]);

  return {
    isValid,
    missingPhotos,
    getMissingPhotoTitles,
    validatePhotos
  };
};
