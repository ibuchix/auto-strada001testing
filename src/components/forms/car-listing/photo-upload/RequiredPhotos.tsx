
/**
 * Changes made:
 * - Refactored into smaller, more focused components
 * - Extracted photo sections, progress indicator, and state management
 * - Improved validation feedback for required photos
 * - Maintained all original functionality while reducing file size
 */

import { Separator } from "@/components/ui/separator";
import { Camera, CameraIcon } from "lucide-react";
import { ValidationError } from "../utils/validation";
import { PhotoUploadProgress } from "./components/PhotoUploadProgress";
import { PhotoSection } from "./components/PhotoSection";
import { useRequiredPhotosUpload } from "./hooks/useRequiredPhotosUpload";
import { exteriorPhotos, interiorPhotos, allRequiredPhotos } from "./data/requiredPhotoData";

interface RequiredPhotosProps {
  isUploading: boolean;
  progress?: number;
  onFileSelect: (file: File, type: string) => Promise<string | null>;
  onValidationChange?: (isValid: boolean) => void;
}

export const RequiredPhotos = ({ 
  isUploading, 
  progress, 
  onFileSelect,
  onValidationChange
}: RequiredPhotosProps) => {
  const {
    uploadedPhotos,
    activeUploads,
    handlePhotoUploaded,
    handleUploadError,
    handleUploadRetry,
    getCompletionPercentage,
    setActiveUpload
  } = useRequiredPhotosUpload({ onValidationChange });
  
  // Generate validation errors for displaying in summary
  const validationErrors: ValidationError[] = allRequiredPhotos
    .filter(photo => !uploadedPhotos[photo.id])
    .map(photo => ({
      field: `photo_${photo.id}`,
      message: `${photo.title} photo is required`,
      severity: "error",
      recoverable: false
    }));

  const completionPercentage = getCompletionPercentage();

  // Function to handle file selection and set active upload
  const handleFileUpload = async (file: File, type: string) => {
    // Set as active upload before starting
    setActiveUpload(type);
    return await onFileSelect(file, type);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Required Photos</h3>
      
      {/* Validation summary and progress indicator */}
      <PhotoUploadProgress
        completionPercentage={completionPercentage}
        totalPhotos={allRequiredPhotos.length}
        validationErrors={validationErrors}
      />
      
      {/* Exterior photos section */}
      <PhotoSection
        title="Exterior Photos"
        description="Please provide clear photos of all exterior angles of your vehicle in good lighting."
        icon={Camera}
        photos={exteriorPhotos}
        uploadedPhotos={uploadedPhotos}
        activeUploads={activeUploads}
        progress={progress}
        onFileSelect={handleFileUpload}
        onPhotoUploaded={handlePhotoUploaded}
        onUploadError={handleUploadError}
        onUploadRetry={handleUploadRetry}
      />
      
      <Separator className="my-6" />
      
      {/* Interior photos section */}
      <PhotoSection
        title="Interior Photos"
        description="Please provide clear photos of the interior, dashboard, and current odometer reading."
        icon={CameraIcon}
        photos={interiorPhotos}
        uploadedPhotos={uploadedPhotos}
        activeUploads={activeUploads}
        progress={progress}
        onFileSelect={handleFileUpload}
        onPhotoUploaded={handlePhotoUploaded}
        onUploadError={handleUploadError}
        onUploadRetry={handleUploadRetry}
      />
    </div>
  );
};
