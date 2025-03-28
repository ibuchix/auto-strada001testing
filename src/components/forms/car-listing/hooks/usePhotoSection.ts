
/**
 * Changes made:
 * - Created custom hook for Photo Upload section
 * - Encapsulated photo validation and submission logic
 * - Added photo processing and validation
 * - Implemented photo management functionality
 */

import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const usePhotoSection = (form: UseFormReturn<CarListingFormData>, carId?: string) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  
  // Photos from form state
  const photos = form.watch('uploadedPhotos') || [];
  
  // Track main (featured) photo
  const [mainPhotoIndex, setMainPhotoIndex] = useState<number>(0);
  
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
      setUploadedCount(prev => prev - 1);
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
  
  // Handle photo uploads
  const handlePhotoUpload = useCallback(async (files: File[]) => {
    if (!carId) {
      toast.error('Please save your listing first before uploading photos');
      return;
    }
    
    if (!files || files.length === 0) return;
    
    setIsProcessingPhoto(true);
    
    try {
      // In a real implementation, this would upload to a storage service
      // For now, we'll simulate the upload
      
      // Validate files
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isSizeValid = file.size <= 10 * 1024 * 1024; // 10MB max
        
        if (!isImage) {
          toast.error(`${file.name} is not an image file`);
        }
        
        if (!isSizeValid) {
          toast.error(`${file.name} exceeds the 10MB size limit`);
        }
        
        return isImage && isSizeValid;
      });
      
      if (validFiles.length === 0) {
        toast.error('No valid files to upload');
        return;
      }
      
      // Simulate upload with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock URLs for uploaded photos
      const uploadedUrls = validFiles.map(
        file => URL.createObjectURL(file)
      );
      
      // Update form with new photos
      const currentPhotos = form.getValues('uploadedPhotos') || [];
      const newPhotos = [...currentPhotos, ...uploadedUrls];
      
      form.setValue('uploadedPhotos', newPhotos, { shouldValidate: true });
      
      // Set main photo if this is the first upload
      if (currentPhotos.length === 0 && uploadedUrls.length > 0) {
        form.setValue('mainPhoto', uploadedUrls[0], { shouldValidate: true });
      }
      
      setUploadedCount(prev => prev + validFiles.length);
      toast.success(`${validFiles.length} photos uploaded successfully`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsProcessingPhoto(false);
    }
  }, [carId, form]);
  
  // Save photos to the server
  const savePhotos = useCallback(async () => {
    if (!carId) {
      toast.error('Cannot save photos without a car ID');
      return;
    }
    
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
  }, [carId, photos]);
  
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
    photos,
    mainPhotoIndex,
    isSaving,
    isProcessingPhoto,
    uploadedCount,
    setAsMainPhoto,
    removePhoto,
    reorderPhotos,
    handlePhotoUpload,
    savePhotos,
    validatePhotoSection
  };
};
