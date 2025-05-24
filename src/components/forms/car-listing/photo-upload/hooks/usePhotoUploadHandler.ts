
/**
 * Changes made:
 * - Fixed TypeScript errors related to function calls and missing properties
 * - Updated to use proper uploadImagesForCar service
 * - 2025-07-18: Integrated with standardized upload service
 * - 2025-05-20: Updated to use direct uploads for immediate processing
 * - 2025-05-23: Updated to use type-safe form helpers
 * - 2025-05-25: Fixed field name typing issues by using string cast
 * - 2025-05-22: Updated to handle string return from directUploadPhoto
 * - 2025-05-24: Added comprehensive debug logging to track upload issues
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
    const uploadSessionId = crypto.randomUUID();
    console.log(`[PhotoUploadHandler][${uploadSessionId}] Starting photo upload process:`, {
      fileCount: files?.length || 0,
      carId: carId,
      files: files?.map(f => ({ name: f.name, size: f.size, type: f.type })) || []
    });
    
    if (!files || files.length === 0) {
      console.warn(`[PhotoUploadHandler][${uploadSessionId}] No files provided`);
      return;
    }
    
    setIsProcessingPhoto(true);
    setCurrentUpload("Processing photos...");
    
    try {
      // Get user ID from session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      console.log(`[PhotoUploadHandler][${uploadSessionId}] Session check:`, {
        hasSession: !!sessionData.session,
        userId: userId
      });
      
      if (!userId) {
        toast.error('You need to be logged in to upload photos');
        return;
      }
      
      // Validate files
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isSizeValid = file.size <= 10 * 1024 * 1024; // 10MB max
        
        console.log(`[PhotoUploadHandler][${uploadSessionId}] File validation:`, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          isImage: isImage,
          isSizeValid: isSizeValid
        });
        
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

      console.log(`[PhotoUploadHandler][${uploadSessionId}] Processing ${validFiles.length} valid files`);
      const uploadedUrls: string[] = [];
      
      // Process each file individually with direct upload
      for (const [index, file] of validFiles.entries()) {
        const fileUploadId = crypto.randomUUID();
        setCurrentUpload(`Uploading ${index + 1}/${validFiles.length}: ${file.name}`);
        
        console.log(`[PhotoUploadHandler][${uploadSessionId}][${fileUploadId}] Uploading file:`, {
          fileName: file.name,
          fileIndex: index + 1,
          totalFiles: validFiles.length,
          carId: carId || "temp",
          category: 'additional_photos'
        });
        
        try {
          // Use direct upload approach and get the string URL back
          const publicUrl = await directUploadPhoto(
            file, 
            carId || "temp", 
            'additional_photos'
          );
          
          console.log(`[PhotoUploadHandler][${uploadSessionId}][${fileUploadId}] Upload successful:`, {
            fileName: file.name,
            publicUrl: publicUrl
          });
          
          if (publicUrl) {
            uploadedUrls.push(publicUrl);
          }
        } catch (uploadError) {
          console.error(`[PhotoUploadHandler][${uploadSessionId}][${fileUploadId}] Upload failed:`, {
            fileName: file.name,
            error: uploadError,
            errorMessage: uploadError instanceof Error ? uploadError.message : String(uploadError)
          });
          
          // Show specific error for this file
          toast.error(`Failed to upload ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }
      
      console.log(`[PhotoUploadHandler][${uploadSessionId}] Upload batch complete:`, {
        totalFiles: validFiles.length,
        successfulUploads: uploadedUrls.length,
        uploadedUrls: uploadedUrls
      });
      
      if (uploadedUrls.length > 0) {
        // Update form with new photos
        const currentPhotos = getFieldValue<string[]>(form, 'uploadedPhotos' as any) || [];
        const newPhotos = [...currentPhotos, ...uploadedUrls];
        
        console.log(`[PhotoUploadHandler][${uploadSessionId}] Updating form:`, {
          currentPhotosCount: currentPhotos.length,
          newPhotosCount: uploadedUrls.length,
          totalPhotosCount: newPhotos.length
        });
        
        setFieldValue(form, 'uploadedPhotos' as any, newPhotos, { shouldValidate: true });
        
        // Set main photo if this is the first upload
        if (currentPhotos.length === 0 && uploadedUrls.length > 0) {
          console.log(`[PhotoUploadHandler][${uploadSessionId}] Setting main photo:`, uploadedUrls[0]);
          setFieldValue(form, 'mainPhoto' as any, uploadedUrls[0], { shouldValidate: true });
        }
        
        setUploadedCount(prev => prev + validFiles.length);
        toast.success(`${uploadedUrls.length} photos uploaded successfully`);
      } else {
        console.error(`[PhotoUploadHandler][${uploadSessionId}] No photos were uploaded successfully`);
        toast.error('No photos were uploaded successfully');
      }
    } catch (error: any) {
      console.error(`[PhotoUploadHandler][${uploadSessionId}] General upload error:`, {
        error: error,
        errorMessage: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to upload photos');
    } finally {
      setIsProcessingPhoto(false);
      setCurrentUpload(null);
      console.log(`[PhotoUploadHandler][${uploadSessionId}] Upload process completed`);
    }
  }, [carId, form]);

  return {
    isProcessingPhoto,
    uploadedCount,
    currentUpload,
    handlePhotoUpload
  };
};
