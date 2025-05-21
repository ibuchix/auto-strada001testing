
/**
 * Changes made:
 * - Created specialized hook for photo management functions
 * - Extracted from usePhotoSection.ts for better maintainability
 * - Handles photo selection, removal, and reordering
 * - 2025-06-20 - Fixed field name compatibility with CarListingFormData
 * - 2025-05-23 - Updated to use type-safe form helpers
 * - 2025-05-25 - Fixed field name typing issues by using string cast
 */
import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { watchField, setFieldValue } from "@/utils/formHelpers";

export const usePhotoManagement = (form: UseFormReturn<CarListingFormData>) => {
  // Track main (featured) photo
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);
  
  // Photos from form state - using our helper for type safety with casting for flexibility
  const photos = watchField<string[]>(form, 'uploadedPhotos' as any) || [];
  
  // Set a photo as the main photo
  const setAsMainPhoto = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) {
      setMainPhotoIndex(index);
      
      // Update form data with main photo info
      const photoUrl = photos[index];
      // Reorder photos to make selected photo the first one (main photo)
      setFieldValue(form, 'uploadedPhotos' as any, [photoUrl, ...photos.filter((_, i) => i !== index)], { shouldValidate: true });
      
      toast.success('Main photo updated');
    }
  }, [photos, form]);
  
  // Remove a photo
  const removePhoto = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) {
      const newPhotos = [...photos];
      newPhotos.splice(index, 1);
      
      setFieldValue(form, 'uploadedPhotos' as any, newPhotos, { shouldValidate: true });
      
      // Update main photo index if needed
      if (index === mainPhotoIndex) {
        setMainPhotoIndex(0);
      } else if (index < mainPhotoIndex) {
        setMainPhotoIndex(mainPhotoIndex - 1);
      }
      
      toast.success('Photo removed');
    }
  }, [photos, mainPhotoIndex, form]);
  
  // Reorder photos
  const reorderPhotos = useCallback((fromIndex: number, toIndex: number) => {
    if (
      fromIndex >= 0 && 
      fromIndex < photos.length && 
      toIndex >= 0 && 
      toIndex < photos.length
    ) {
      const newPhotos = [...photos];
      const [movedItem] = newPhotos.splice(fromIndex, 1);
      newPhotos.splice(toIndex, 0, movedItem);
      
      setFieldValue(form, 'uploadedPhotos' as any, newPhotos, { shouldValidate: true });
      
      // Update main photo index if needed
      if (fromIndex === mainPhotoIndex) {
        setMainPhotoIndex(toIndex);
      } else if (
        (fromIndex < mainPhotoIndex && toIndex >= mainPhotoIndex) ||
        (fromIndex > mainPhotoIndex && toIndex <= mainPhotoIndex)
      ) {
        setMainPhotoIndex(
          fromIndex < mainPhotoIndex ? mainPhotoIndex - 1 : mainPhotoIndex + 1
        );
      }
      
      toast.success('Photos reordered');
    }
  }, [photos, mainPhotoIndex, form]);

  return {
    photos,
    mainPhotoIndex,
    setAsMainPhoto,
    removePhoto,
    reorderPhotos
  };
};
