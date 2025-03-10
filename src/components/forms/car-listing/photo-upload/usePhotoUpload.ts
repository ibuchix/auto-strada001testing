
/**
 * Changes made:
 * - 2024-03-20: Fixed table references to match database schema
 * - 2024-03-20: Added proper type handling for photos
 */

import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface RequiredPhotos {
  [key: string]: string | null;
}

export const usePhotoUpload = (carId?: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload only image files");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB");
      return false;
    }

    return true;
  };

  const handleFileUpload = async (file: File, type: string) => {
    if (!carId) {
      toast.error("Car ID is required for file upload");
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${carId}/${type}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('car-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('car-files')
        .getPublicUrl(filePath);

      // Log the file upload - directly update the cars table instead
      if (type.startsWith('additional_')) {
        const { data: currentPhotos, error: fetchError } = await supabase
          .from('cars')
          .select('images')
          .eq('id', carId)
          .single();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw new Error('Failed to fetch current photos');
        }

        const additionalPhotos = Array.isArray(currentPhotos?.images) 
          ? currentPhotos.images 
          : [];

        const updatedPhotos = [...additionalPhotos, publicUrl];

        const { error: updateError } = await supabase
          .from('cars')
          .update({ images: updatedPhotos })
          .eq('id', carId);

        if (updateError) throw updateError;
      } else {
        const { data: currentPhotos, error: fetchError } = await supabase
          .from('cars')
          .select('required_photos')
          .eq('id', carId)
          .single();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          throw new Error('Failed to fetch current photos');
        }

        // Cast the required_photos to our RequiredPhotos type after validating it's an object
        const requiredPhotos: RequiredPhotos = (
          typeof currentPhotos?.required_photos === 'object' && 
          currentPhotos?.required_photos !== null && 
          !Array.isArray(currentPhotos?.required_photos)
        ) ? currentPhotos.required_photos as RequiredPhotos : {};

        const updatedPhotos: RequiredPhotos = {
          ...requiredPhotos,
          [type]: publicUrl
        };

        const { error: updateError } = await supabase
          .from('cars')
          .update({ required_photos: updatedPhotos })
          .eq('id', carId);

        if (updateError) throw updateError;
      }

      setUploadedFiles(prev => [...prev, publicUrl]);
      setUploadProgress(prev => prev + (100 / (type.startsWith('additional_') ? 5 : 9))); // 9 required photos or 5 additional
      toast.success(`Photo uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, uploadedFiles, handleFileUpload };
};
