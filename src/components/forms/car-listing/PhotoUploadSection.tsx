import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { RequiredPhotos } from "./photo-upload/RequiredPhotos";
import { AdditionalPhotos } from "./photo-upload/AdditionalPhotos";
import { usePhotoUpload } from "./photo-upload/usePhotoUpload";
import { PhotoUploadSectionProps } from "./photo-upload/types";
import { useEffect } from "react";

interface ExtendedPhotoUploadSectionProps extends PhotoUploadSectionProps {
  onProgressUpdate?: (progress: number) => void;
}

export const PhotoUploadSection = ({ form, carId, onProgressUpdate }: ExtendedPhotoUploadSectionProps) => {
  const { isUploading, uploadProgress, uploadedFiles, handleFileUpload } = usePhotoUpload(carId);

  useEffect(() => {
    if (uploadedFiles.length > 0) {
      form.setValue('uploadedPhotos', uploadedFiles);
    }
  }, [uploadedFiles, form]);

  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(uploadProgress);
    }
  }, [uploadProgress, onProgressUpdate]);

  const handleAdditionalPhotos = (files: File[]) => {
    files.forEach((file, index) => {
      handleFileUpload(file, `additional_${index}`);
    });
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
        onFilesSelect={handleAdditionalPhotos}
      />
    </div>
  );
};