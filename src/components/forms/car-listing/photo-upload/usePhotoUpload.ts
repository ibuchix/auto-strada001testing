import { useState } from "react";
import { toast } from "sonner";
import { CarPhotoData } from "./types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const usePhotoUpload = (carId?: string) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('carId', carId);

      const response = await fetch('/api/process-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to upload image');
      }

      const { filePath } = await response.json();

      // Update progress
      const newProgress = uploadProgress + 1;
      setUploadProgress(newProgress);

      toast.success(`${type} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProgress, handleFileUpload };
};