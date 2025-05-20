
/**
 * Changes made:
 * - Fixed TypeScript errors related to function calls and missing properties
 * - Updated to use proper uploadImagesForCar service
 * - 2025-07-18: Integrated with standardized upload service
 * - 2025-05-20: Updated to use direct uploads for immediate processing
 * - 2025-05-23: Updated to use type-safe form helpers
 */
import { useState, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { directUploadPhoto } from "@/services/supabase/uploadService";
import { supabase } from "@/integrations/supabase/client";
import { watchField, setFieldValue, getFieldValue } from "@/utils/formHelpers";

export const usePhotoUploadHandler = (
  form: UseFormReturn<CarListingFormData>,
  carId?: string
) => {
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [currentUpload, setCurrentUpload] = useState<string | null>(null);
  
  // Handle photo uploads
  const handlePhotoUpload = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    setIsProcessingPhoto(true);
    setCurrentUpload("Processing photos...");
    
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

      const uploadedUrls: string[] = [];
      
      // Process each file individually with direct upload
      for (const [index, file] of validFiles.entries()) {
        setCurrentUpload(`Uploading ${index + 1}/${validFiles.length}: ${file.name}`);
        
        // Use direct upload approach
        const publicUrl = await directUploadPhoto(
          file, 
          carId || "temp", 
          'additional_photos'
        );
        
        if (publicUrl) {
          uploadedUrls.push(publicUrl);
        }
      }
      
      if (uploadedUrls.length > 0) {
        // Update form with new photos
        const currentPhotos = getFieldValue<string[]>(form, 'uploaded_photos') || [];
        const newPhotos = [...currentPhotos, ...uploadedUrls];
        
        setFieldValue(form, 'uploaded_photos', newPhotos, { shouldValidate: true });
        
        // Set main photo if this is the first upload
        if (currentPhotos.length === 0 && uploadedUrls.length > 0) {
          setFieldValue(form, 'main_photo', uploadedUrls[0], { shouldValidate: true });
        }
        
        setUploadedCount(prev => prev + validFiles.length);
        toast.success(`${validFiles.length} photos uploaded successfully`);
      }
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast.error(error.message || 'Failed to upload photos');
    } finally {
      setIsProcessingPhoto(false);
      setCurrentUpload(null);
    }
  }, [carId, form]);

  return {
    isProcessingPhoto,
    uploadedCount,
    currentUpload,
    handlePhotoUpload
  };
};
