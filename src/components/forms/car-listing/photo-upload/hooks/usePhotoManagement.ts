
/**
 * Changes made:
 * - Created specialized hook for photo management functions
 * - Extracted from usePhotoSection.ts for better maintainability
 * - Handles photo selection, removal, and reordering
 */
import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const usePhotoManagement = (form: UseFormReturn<CarListingFormData>) => {
  // Track main (featured) photo
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);
  
  // Photos from form state
  const photos = form.watch('uploadedPhotos') || [];
  
  // Set a photo as the main photo
  const setAsMainPhoto = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) {
      setMainPhotoIndex(index);
      
      // Update form data with main photo info
      const photoUrl = photos[index];
      form.setValue('mainPhoto', photoUrl, { shouldValidate: true });
      
      toast.success('Main photo updated');
    }
  }, [photos, form]);
  
  // Remove a photo
  const removePhoto = useCallback((index: number) => {
    if (index >= 0 && index < photos.length) {
      const newPhotos = [...photos];
      newPhotos.splice(index, 1);
      
      form.setValue('uploadedPhotos', newPhotos, { shouldValidate: true });
      
      // Update main photo index if needed
      if (index === mainPhotoIndex) {
        setMainPhotoIndex(0);
        form.setValue('mainPhoto', newPhotos[0] || null, { shouldValidate: true });
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
      
      form.setValue('uploadedPhotos', newPhotos, { shouldValidate: true });
      
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
