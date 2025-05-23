
/**
 * Hook to manage photo upload section state and actions
 * - 2025-04-05: Created to separate state management from the UI component
 * - 2025-04-05: Handles validation, saving, and error management
 * - 2025-05-23: Updated to use type-safe form helpers
 * - 2025-05-24: Updated to use camelCase consistently
 * - 2025-06-24: Updated to use standardizePhotoCategory for consistent field mapping
 * - 2025-05-25: Fixed typing issues by using string casts for field names
 */
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { PhotoUploadError } from '../types';
import { toast } from 'sonner';
import { CarListingFormData } from '@/types/forms';
import { watchField, setFieldValue, getFieldValue } from '@/utils/formHelpers';
import { standardizePhotoCategory } from '@/utils/photoMapping';

interface UsePhotoUploadSectionProps {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
  onValidate?: () => Promise<boolean>;
}

export const usePhotoUploadSection = ({
  form,
  carId,
  onValidate
}: UsePhotoUploadSectionProps) => {
  const [savingProgress, setSavingProgress] = useState(false);
  const [uploadError, setUploadError] = useState<PhotoUploadError | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPhotoSectionValid, setIsPhotoSectionValid] = useState(false);
  const watchedPhotos = watchField<string[]>(form, 'uploadedPhotos' as any) || [];

  // Handle validation change
  const handleValidationChange = (isValid: boolean) => {
    setIsPhotoSectionValid(isValid);
    setFieldValue(form, 'photoValidationPassed' as any, isValid, { 
      shouldValidate: true,
      shouldDirty: true 
    });
  };

  // Handle file upload
  const handlePhotoUpload = async (files: File[]) => {
    try {
      setUploadError(null);
      
      if (files.length === 0) {
        setUploadError({
          message: "No files selected",
          description: "Please select at least one photo to upload."
        });
        return;
      }
      
      // Placeholder for upload logic
      console.log(`Uploading ${files.length} photos...`);
    } catch (error: any) {
      setUploadError({
        message: "Error uploading photos",
        description: error.message || "There was a problem uploading your photos. Please try again."
      });
      console.error(error);
    }
  };

  // Handle file selection for required photos
  const handleFileSelect = async (file: File, type: string): Promise<string | null> => {
    try {
      // Any additional processing...
      
      // Return the file URL if successful
      const mockUrl = "https://example.com/photo.jpg";
      
      // Since this is a successful upload, also update the requiredPhotos object in the form
      const requiredPhotos = getFieldValue<Record<string, string>>(form, 'requiredPhotos' as any) || {};
      const standardizedType = standardizePhotoCategory(type);
      
      // Add photo to requiredPhotos object using the standardized name
      setFieldValue(form, 'requiredPhotos' as any, {
        ...requiredPhotos,
        [standardizedType]: mockUrl
      }, {
        shouldDirty: true
      });
      
      return mockUrl;
    } catch (error) {
      console.error("Error selecting file:", error);
      return null;
    }
  };

  // Handle removing a photo
  const handleRemovePhoto = (photoUrl: string) => {
    const currentPhotos = getFieldValue<string[]>(form, 'uploadedPhotos' as any) || [];
    const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);
    setFieldValue(form, 'uploadedPhotos' as any, updatedPhotos, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  // Handle saving photos
  const handleSavePhotos = async () => {
    try {
      setSavingProgress(true);
      setSavedSuccess(false);
      setUploadError(null);
      
      // Validate required photos first
      if (!isPhotoSectionValid) {
        setUploadError({
          message: "Missing Required Photos",
          description: "Please upload all required photos before saving."
        });
        return;
      }
      
      // If onValidate is provided, run validation
      if (onValidate) {
        const isValid = await onValidate();
        if (!isValid) {
          setUploadError({
            message: "Validation Failed",
            description: "Please correct the validation errors before proceeding."
          });
          return;
        }
      }
      
      // Save logic here
      // Just a delay for demonstration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSavedSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3000);
    } catch (error: any) {
      setUploadError({
        message: "Error saving photos",
        description: error.message || "There was a problem saving your photos. Please try again."
      });
      console.error(error);
    } finally {
      setSavingProgress(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setUploadError(null);
  };

  // Clear success state
  const clearSuccess = () => {
    setSavedSuccess(false);
  };

  return {
    savingProgress,
    uploadError,
    savedSuccess,
    isPhotoSectionValid,
    watchedPhotos,
    handleValidationChange,
    handlePhotoUpload,
    handleFileSelect,
    handleRemovePhoto,
    handleSavePhotos,
    clearError,
    clearSuccess
  };
};
