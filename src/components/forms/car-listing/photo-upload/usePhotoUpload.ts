
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors
 * - 2024-03-26: Updated to use the correct Supabase storage method
 * - 2024-03-26: Added proper typing for dropzone integration
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface UsePhotoUploadProps {
  carId?: string;
  onProgressUpdate?: (progress: number) => void;
}

export const usePhotoUpload = ({ carId, onProgressUpdate }: UsePhotoUploadProps = {}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!carId) {
      toast.error("Car ID is required to upload photos.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const filePath = `cars/${carId}/${uuidv4()}-${file.name}`;
        return uploadPhoto(file, filePath, carId);
      });

      const results = await Promise.all(uploadPromises);
      setUploadedPhotos(prevPhotos => [...prevPhotos, ...results.filter(Boolean) as string[]]);
      toast.success("Photos uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast.error(error.message || "Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  }, [carId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg']
    },
    maxFiles: 10,
    disabled: isUploading
  });

  const uploadPhoto = async (file: File, filePath: string, carId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        throw new Error(error.message);
      }

      // Construct the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      await savePhotoToDb(filePath, carId);
      return publicUrl;
    } catch (error: any) {
      console.error('Error during photo upload:', error);
      throw error;
    }
  };

  const savePhotoToDb = async (filePath: string, carId: string) => {
    try {
      // Insert into car_file_uploads table for tracking
      const { error: uploadError } = await supabase
        .from('car_file_uploads')
        .insert({
          car_id: carId,
          file_path: filePath,
          file_type: 'image/jpeg',
          upload_status: 'completed'
        });

      if (uploadError) throw uploadError;

      // Get current additional_photos from car
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('additional_photos')
        .eq('id', carId)
        .single();

      if (carError) throw carError;

      // Update the additional_photos array
      const currentPhotos = car.additional_photos || [];
      
      // Convert to array if JSON is not an array
      const photosArray = Array.isArray(currentPhotos) ? currentPhotos : [];
      const newPhotos = [...photosArray, filePath];

      // Update the car record
      const { error: updateError } = await supabase
        .from('cars')
        .update({ additional_photos: newPhotos })
        .eq('id', carId);

      if (updateError) throw updateError;

      return filePath;
    } catch (error) {
      console.error('Error saving photo to database:', error);
      throw error;
    }
  };

  return {
    getRootProps,
    getInputProps,
    isDragActive,
    isUploading,
    uploadedPhotos,
    setUploadedPhotos
  };
};
