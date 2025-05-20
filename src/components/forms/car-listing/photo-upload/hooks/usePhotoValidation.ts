
/**
 * Hook to handle photo validation
 * Provides functionality to validate photos against requirements
 * Changes made:
 * - Updated to better handle minimal form objects
 * - Added safety checks for missing form methods
 * - Enhanced type safety with better error handling
 * - Updated to use camelCase field names consistently
 */
import { useState, useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { watchField, setFieldValue } from "@/utils/formHelpers";

export const usePhotoValidation = (form: UseFormReturn<CarListingFormData>) => {
  const [isSaving, setIsSaving] = useState(false);
  const [missingPhotos, setMissingPhotos] = useState<string[]>([]);

  // Get all photo URLs from the form - safely handle if watch returns a non-array
  const photos = watchField<string[]>(form, "uploadedPhotos") || [];
  
  // Check if we have the minimum required photos (3)
  const isValid = photos.length >= 3;

  // Function to validate photos
  const validatePhotos = useCallback(() => {
    if (!isValid) {
      // Show error message for missing photos
      toast.error("Please upload at least 3 photos", {
        description: "Photos are required to proceed"
      });
      return false;
    }
    return true;
  }, [isValid]);

  // Function to validate the photo section
  const validatePhotoSection = useCallback(() => {
    const valid = validatePhotos();
    if (valid) {
      setFieldValue(form, "photoValidationPassed", true);
    }
    return valid;
  }, [validatePhotos, form]);

  // Function to get user-friendly titles for missing photo types
  const getMissingPhotoTitles = useCallback(() => {
    return missingPhotos.map(p => {
      // Convert camelCase or snake_case to readable format
      return p
        .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
    });
  }, [missingPhotos]);

  // Save photos to form
  const savePhotos = useCallback(async () => {
    setIsSaving(true);
    try {
      // Mark photos as validated if we have enough
      if (photos.length >= 3) {
        setFieldValue(form, "photoValidationPassed", true);
        return true;
      } else {
        toast.error("Not enough photos", {
          description: "Please upload at least 3 photos"
        });
        return false;
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      toast.error("Failed to save photos");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [photos, form]);

  return {
    isValid,
    missingPhotos,
    getMissingPhotoTitles,
    validatePhotos,
    isSaving,
    savePhotos,
    validatePhotoSection
  };
};
