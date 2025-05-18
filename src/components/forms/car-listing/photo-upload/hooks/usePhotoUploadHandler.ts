
/**
 * Changes made:
 * - Fixed TypeScript errors related to function calls and missing properties
 * - Updated to use proper uploadImagesForCar service
 * - 2025-07-18: Integrated with standardized upload service
 */
import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { uploadImagesForCar } from "@/services/supabase/uploadService";
import { supabase } from "@/integrations/supabase/client";

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
      // Get user ID from session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        toast.error('You need to be logged in to upload photos');
        return;
      }
      
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
      
      // Upload files using the service
      const uploadedPaths = await uploadImagesForCar(validFiles, carId, 'additional_photos', userId);
      
      if (uploadedPaths.length > 0) {
        // Get public URLs for all uploaded files
        const uploadedUrls = uploadedPaths.map(path => {
          const { data } = supabase.storage
            .from('car-images')
            .getPublicUrl(path);
          return data.publicUrl;
        });
        
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
      }
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
