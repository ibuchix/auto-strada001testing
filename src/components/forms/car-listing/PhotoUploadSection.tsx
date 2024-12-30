import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { RequiredPhotos } from "./photo-upload/RequiredPhotos";
import { AdditionalPhotos } from "./photo-upload/AdditionalPhotos";
import { usePhotoUpload } from "./photo-upload/usePhotoUpload";
import { PhotoUploadSectionProps } from "./photo-upload/types";

export const PhotoUploadSection = ({ form, carId }: PhotoUploadSectionProps) => {
  const { isUploading, handleFileUpload } = usePhotoUpload(carId);

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
      />
      <AdditionalPhotos
        isUploading={isUploading}
        onFilesSelect={handleAdditionalPhotos}
      />
    </div>
  );
};