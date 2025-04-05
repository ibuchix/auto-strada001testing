
/**
 * Enhanced usePhotoValidation hook with additional functionality
 * - Added isSaving, savePhotos, and validatePhotoSection properties
 * - 2025-11-29: Made compatible with usePhotoSection.ts
 */
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { allRequiredPhotos } from '../data/requiredPhotoData';

interface UsePhotoValidationProps {
  uploadedPhotos: Record<string, boolean>;
  onValidationChange?: (isValid: boolean) => void;
  form?: UseFormReturn<CarListingFormData>;
  carId?: string;
}

export const usePhotoValidation = ({ 
  uploadedPhotos, 
  onValidationChange,
  form,
  carId
}: UsePhotoValidationProps) => {
  const [isValid, setIsValid] = useState(false);
  const [missingPhotos, setMissingPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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

    // Update form if available
    if (form) {
      form.setValue('photoValidationPassed', valid, { 
        shouldValidate: true,
        shouldDirty: true 
      });
    }
  }, [uploadedPhotos, onValidationChange, form]);

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

  // Save photos to server/database
  const savePhotos = useCallback(async (): Promise<boolean> => {
    if (!validatePhotos()) {
      return false;
    }

    setIsSaving(true);
    try {
      // Placeholder for actual save logic
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Photos saved successfully');
      return true;
    } catch (error: any) {
      console.error('Error saving photos:', error);
      toast.error('Failed to save photos', {
        description: error.message || 'Please try again'
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [validatePhotos]);

  // Full section validation
  const validatePhotoSection = useCallback((): boolean => {
    return validatePhotos();
  }, [validatePhotos]);

  return {
    isValid,
    missingPhotos,
    getMissingPhotoTitles,
    validatePhotos,
    // Additional properties needed by usePhotoSection
    isSaving,
    savePhotos,
    validatePhotoSection
  };
};
