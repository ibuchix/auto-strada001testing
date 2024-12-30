import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CarPhotoData } from "./types";

export const usePhotoUpload = (carId?: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (file: File, type: string) => {
    if (!carId) {
      toast.error("Car ID is required for file upload");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${carId}/${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('car-files')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Log the upload
      const { error: logError } = await supabase
        .from('car_file_uploads')
        .insert({
          car_id: carId,
          file_path: filePath,
          file_type: type,
          upload_status: 'completed'
        });

      if (logError) throw logError;

      // Get current car data
      const { data: carData, error: fetchError } = await supabase
        .from('cars')
        .select('required_photos, additional_photos')
        .eq('id', carId)
        .single();

      if (fetchError) throw fetchError;

      const typedCarData = carData as CarPhotoData;

      // Update the car's photos
      const updates = type.includes('additional')
        ? {
            additional_photos: [...(typedCarData.additional_photos || []), filePath]
          }
        : {
            required_photos: {
              ...(typedCarData.required_photos || {}),
              [type]: filePath
            }
          };

      const { error: updateError } = await supabase
        .from('cars')
        .update(updates)
        .eq('id', carId);

      if (updateError) throw updateError;

      // Update progress
      const newProgress = (Object.values(typedCarData.required_photos || {}).filter(Boolean).length + 1);
      setUploadProgress(newProgress);

      toast.success(`${type} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${type}`);
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, handleFileUpload };
};