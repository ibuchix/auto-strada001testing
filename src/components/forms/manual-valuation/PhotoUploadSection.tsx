
/**
 * Changes made:
 * - 2024-08-15: Added service history document upload functionality
 * - 2024-08-15: Improved file selection and preview UI
 * - 2024-08-16: Fixed File constructor usage for document preview
 * - 2024-08-25: Refactored into smaller, more maintainable components
 * - 2024-08-27: Fixed type mismatch between handleFileUpload and component props
 */

import { UseFormReturn } from "react-hook-form";
import { VehiclePhotoSection } from "./components/VehiclePhotoSection";
import { DocumentUploader } from "./components/DocumentUploader";
import { useFileUpload } from "./hooks/useFileUpload";

interface PhotoUploadSectionProps {
  form: UseFormReturn<any>;
  onProgressUpdate?: (progress: number) => void;
}

export const PhotoUploadSection = ({ form, onProgressUpdate }: PhotoUploadSectionProps) => {
  const uploadedFiles = form.watch('serviceHistoryFiles') || [];
  
  const {
    isUploading,
    progress,
    handleFileUpload,
    handleDocumentUpload,
    handleAdditionalPhotos,
    removeUploadedFile
  } = useFileUpload({ form, onProgressUpdate });

  return (
    <div className="space-y-8">
      <VehiclePhotoSection 
        isUploading={isUploading}
        progress={progress}
        onFileSelect={handleFileUpload}
        onAdditionalPhotosSelect={handleAdditionalPhotos}
      />
      
      <DocumentUploader
        uploadedFiles={uploadedFiles}
        isUploading={isUploading}
        progress={progress}
        onDocumentUpload={handleDocumentUpload}
        onRemoveUploadedFile={removeUploadedFile}
      />
    </div>
  );
};
