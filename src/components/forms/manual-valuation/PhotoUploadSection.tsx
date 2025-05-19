
/**
 * Changes made:
 * - 2024-08-15: Added service history document upload functionality
 * - 2024-08-15: Improved file selection and preview UI
 * - 2024-08-16: Fixed File constructor usage for document preview
 * - 2024-08-25: Refactored into smaller, more maintainable components
 * - 2024-08-27: Fixed type mismatch between handleFileUpload and component props
 * - 2025-05-20: Added progress feedback and current file indicator
 * - 2025-05-22: Fixed type incompatibility between FileList and File
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
    uploadingFile,
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
        uploadingFile={uploadingFile}
        // Create an adapter function to handle FileList vs File type mismatch
        onFileSelect={(file, type) => {
          // This function expects a File and returns a Promise<string | null>
          return handleFileUpload(file, type);
        }}
        // Create an adapter function for additional photos
        onAdditionalPhotosSelect={(files) => {
          // Convert FileList to File array if needed
          if (files instanceof FileList) {
            const fileArray = Array.from(files);
            return handleAdditionalPhotos(fileArray);
          }
          return handleAdditionalPhotos(files);
        }}
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
