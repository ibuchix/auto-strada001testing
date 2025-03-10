
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { RequiredPhotos } from "./photo-upload/RequiredPhotos";
import { AdditionalPhotos } from "./photo-upload/AdditionalPhotos";
import { usePhotoUpload } from "./photo-upload/usePhotoUpload";
import { PhotoUploadSectionProps } from "./photo-upload/types";
import { useEffect, useState } from "react";

interface ExtendedPhotoUploadSectionProps extends PhotoUploadSectionProps {
  onProgressUpdate?: (progress: number) => void;
}

export const PhotoUploadSection = ({ form, carId, onProgressUpdate }: ExtendedPhotoUploadSectionProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { isUploading, uploadedPhotos, setUploadedPhotos } = usePhotoUpload({ 
    carId: carId 
  });

  useEffect(() => {
    if (uploadedPhotos.length > 0) {
      form.setValue('uploadedPhotos', uploadedPhotos);
    }
  }, [uploadedPhotos, form]);

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(uploadProgress);
    }
  }, [uploadProgress, onProgressUpdate]);

  const handleFileUpload = (file: File, type: string) => {
    // This function is just a placeholder since we're now using the hooks directly
    setUploadProgress(prev => Math.min(prev + 10, 100));
  };

  return (
    <div className="space-y-6">
      <RequiredPhotos
        isUploading={isUploading}
        onFileSelect={handleFileUpload}
        progress={uploadProgress}
      />
      <AdditionalPhotos
        isUploading={isUploading}
        onFilesSelect={(files) => {
          files.forEach((file) => handleFileUpload(file, 'additional'));
        }}
      />
    </div>
  );
};
