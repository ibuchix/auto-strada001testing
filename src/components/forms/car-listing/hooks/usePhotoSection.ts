
/**
 * Changes made:
 * - Fixed TypeScript errors related to function calls and missing properties
 * - Updated composition pattern to correctly handle all required properties
 * - Added missing validation functions
 * - 2025-12-01: Fixed invalid function argument and missing properties
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { usePhotoManagement } from "../photo-upload/hooks/usePhotoManagement";
import { usePhotoUploadHandler } from "../photo-upload/hooks/usePhotoUploadHandler";
import { usePhotoValidation } from "../photo-upload/hooks/usePhotoValidation";

// Type for the save photos functionality
interface SavePhotosFunctionality {
  isSaving: boolean;
  savePhotos: () => Promise<boolean>;
  validatePhotoSection: () => boolean;
}

// Type for the validation result
interface ValidationResult {
  isValid: boolean;
  missingPhotos: string[];
  getMissingPhotoTitles: () => string[];
  validatePhotos: () => boolean;
}

export const usePhotoSection = (form: UseFormReturn<CarListingFormData>, carId?: string) => {
  // Compose functionality from smaller hooks
  const photoManagement = usePhotoManagement(form);
  
  // Pass the form to usePhotoUploadHandler with carId (if available)
  const photoUpload = usePhotoUploadHandler(form, carId);
  
  // Use the photoValidation hook for validation functions
  const photoValidation = usePhotoValidation(form);
  
  // Combine and return all the functionality with the same API
  return {
    // From usePhotoManagement
    photos: photoManagement.photos,
    mainPhotoIndex: photoManagement.mainPhotoIndex,
    setAsMainPhoto: photoManagement.setAsMainPhoto,
    removePhoto: photoManagement.removePhoto,
    reorderPhotos: photoManagement.reorderPhotos,
    
    // From usePhotoUploadHandler
    isProcessingPhoto: photoUpload.isProcessingPhoto,
    uploadedCount: photoUpload.uploadedCount,
    handlePhotoUpload: photoUpload.handlePhotoUpload,
    
    // From usePhotoValidation
    isSaving: photoValidation.isSaving,
    savePhotos: photoValidation.savePhotos,
    validatePhotoSection: photoValidation.validatePhotoSection 
  };
};
