
/**
 * Changes made:
 * - Created specialized hook for photo upload handling
 * - Extracted from usePhotoSection.ts for better maintainability
 * - Handles file validation, upload simulation and form updates
 */
import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const usePhotoUploadHandler = (
  form: UseFormReturn<CarListingFormData>,
  carId?: string
) => {
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  
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

  return {
    isProcessingPhoto,
    uploadedCount,
    handlePhotoUpload
  };
};
