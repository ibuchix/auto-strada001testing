
/**
 * Changes made:
 * - 2024-03-26: Fixed TypeScript errors
 * - 2024-03-26: Updated to use the correct Supabase storage method
 * - 2024-03-26: Added proper typing for dropzone integration
 * - 2024-08-09: Enhanced to use organized Supabase Storage with categorized structure
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface UsePhotoUploadProps {
  carId?: string;
  category?: string; // Added to support categorization of images
  onProgressUpdate?: (progress: number) => void;
}

export const usePhotoUpload = ({ carId, category = 'general', onProgressUpdate }: UsePhotoUploadProps = {}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!carId) {
      toast.error("Car ID is required to upload photos.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const totalFiles = acceptedFiles.length;
      let completedFiles = 0;
      
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        // Create a structured path for better organization
        const filePath = `${carId}/${category}/${uuidv4()}-${file.name}`;
        const result = await uploadPhoto(file, filePath, carId, category);
        
        // Update progress
        completedFiles++;
        const newProgress = Math.round((completedFiles / totalFiles) * 100);
        setUploadProgress(newProgress);
        if (onProgressUpdate) {
          onProgressUpdate(newProgress);
        }
        
        return result;
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
  }, [carId, category, onProgressUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.webp']
    },
    maxFiles: 10,
    disabled: isUploading
  });

  const uploadPhoto = async (file: File, filePath: string, carId: string, category: string): Promise<string | null> => {
    try {
      // Show file size for debugging
      console.log(`Uploading file: ${file.name}, size: ${(file.size / 1024).toFixed(2)} KB`);
      
      // Compress image if it's too large (> 5MB)
      let fileToUpload = file;
      if (file.size > 5 * 1024 * 1024) {
        fileToUpload = await compressImage(file);
        console.log(`Compressed file size: ${(fileToUpload.size / 1024).toFixed(2)} KB`);
      }
      
      const { data, error } = await supabase.storage
        .from('car-images')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: true // Changed to true to update if file exists
        });

      if (error) {
        console.error('Error uploading image:', error);
        throw new Error(error.message);
      }

      // Construct the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      await savePhotoToDb(filePath, carId, category);
      return publicUrl;
    } catch (error: any) {
      console.error('Error during photo upload:', error);
      throw error;
    }
  };

  // Basic image compression function
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1600px width or height)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1600;
          
          if (width > height && width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with reduced quality
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            
            resolve(newFile);
          }, 'image/jpeg', 0.8); // 80% quality JPEG
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const savePhotoToDb = async (filePath: string, carId: string, category: string) => {
    try {
      // Insert into car_file_uploads table for tracking
      const { error: uploadError } = await supabase
        .from('car_file_uploads')
        .insert({
          car_id: carId,
          file_path: filePath,
          file_type: 'image/jpeg',
          upload_status: 'completed',
          category: category // Add category information
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
    uploadProgress,
    uploadedPhotos,
    setUploadedPhotos
  };
};
