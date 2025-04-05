
/**
 * Changes made:
 * - Created specialized hook for photo validation
 * - Extracted from usePhotoSection.ts for better maintainability
 * - Handles validation logic and saving photos
 */
import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const usePhotoValidation = (
  form: UseFormReturn<CarListingFormData>,
  carId?: string
) => {
  const [isSaving, setIsSaving] = useState(false);
  
  // Save photos to the server
  const savePhotos = useCallback(async () => {
    if (!carId) {
      toast.error('Cannot save photos without a car ID');
      return;
    }
    
    const photos = form.watch('uploadedPhotos') || [];
    
    if (photos.length === 0) {
      toast.error('Please upload at least one photo before saving');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would send the URLs to the server
      toast.success('Photos saved successfully');
    } catch (error) {
      console.error('Error saving photos:', error);
      toast.error('Failed to save photos');
    } finally {
      setIsSaving(false);
    }
  }, [carId, form]);
  
  // Validate the photo section
  const validatePhotoSection = useCallback(() => {
    const currentPhotos = form.getValues('uploadedPhotos') || [];
    
    if (currentPhotos.length < 3) {
      toast.error('Please upload at least 3 photos of your vehicle');
      return false;
    }
    
    const mainPhoto = form.getValues('mainPhoto');
    if (!mainPhoto) {
      // If no main photo is selected, set the first one
      form.setValue('mainPhoto', currentPhotos[0], { shouldValidate: true });
    }
    
    return true;
  }, [form]);

  return {
    isSaving,
    savePhotos,
    validatePhotoSection
  };
};
