import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

      const { error: logError } = await supabase
        .from('car_file_uploads')
        .insert({
          car_id: carId,
          file_path: filePath,
          file_type: type,
          upload_status: 'completed',
          image_metadata: {
            size: file.size,
            type: file.type,
            name: file.name
          }
        });

      if (logError) {
        console.error('Log error:', logError);
        throw new Error('Failed to log file upload');
      }

      if (type.startsWith('additional_')) {
        const { data: currentPhotos } = await supabase
          .from('cars')
          .select('additional_photos')
          .eq('id', carId)
          .single();

        const additionalPhotos = currentPhotos?.additional_photos || [];
        const updatedPhotos = Array.isArray(additionalPhotos) 
          ? [...additionalPhotos, publicUrl]
          : [publicUrl];

        const { error: updateError } = await supabase
          .from('cars')
          .update({ additional_photos: updatedPhotos })
          .eq('id', carId);

        if (updateError) throw updateError;
      } else {
        const { data: currentPhotos } = await supabase
          .from('cars')
          .select('required_photos')
          .eq('id', carId)
          .single();

        const requiredPhotos = currentPhotos?.required_photos || {};
        const updatedPhotos = {
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