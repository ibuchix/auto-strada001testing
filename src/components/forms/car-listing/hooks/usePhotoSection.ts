
/**
 * Changes made:
 * - Refactored into smaller, more focused hooks
 * - Now uses composition pattern to combine specialized hooks
 * - Maintains the same API while reducing file complexity
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { usePhotoManagement } from "../photo-upload/hooks/usePhotoManagement";
import { usePhotoUploadHandler } from "../photo-upload/hooks/usePhotoUploadHandler";
import { usePhotoValidation } from "../photo-upload/hooks/usePhotoValidation";

export const usePhotoSection = (form: UseFormReturn<CarListingFormData>, carId?: string) => {
  // Compose functionality from smaller hooks
  const photoManagement = usePhotoManagement(form);
  const photoUpload = usePhotoUploadHandler(form, carId);
  const photoValidation = usePhotoValidation(form, carId);
  
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
