
/**
 * Changes made:
 * - Added validation to ensure all required photos are uploaded
 * - Added ValidationSummary component to display validation status
 * - Integrated with onValidationChange callback for form integration
 * - Maintained all original functionality while adding validation
 * - Restyled to match brand guidelines with a single required indicator per section
 */

import { Separator } from "@/components/ui/separator";
import { Camera, CameraIcon } from "lucide-react";
import { ValidationError } from "../utils/validation";
import { PhotoUploadProgress } from "./components/PhotoUploadProgress";
import { PhotoSection } from "./components/PhotoSection";
import { useRequiredPhotosUpload } from "./hooks/useRequiredPhotosUpload";
import { exteriorPhotos, interiorPhotos, allRequiredPhotos } from "./data/requiredPhotoData";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-8">
      <h3 className="text-xl font-kanit font-semibold text-body">Required Photos</h3>
      
      {/* Validation summary and progress indicator */}
      <PhotoUploadProgress
        completionPercentage={completionPercentage}
        totalPhotos={allRequiredPhotos.length}
        uploadedPhotos={uploadedPhotos}
        validationErrors={validationErrors}
        onValidationChange={onValidationChange}
      />
      
      <Card className="p-5 shadow-sm border-accent">
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
      </Card>
      
      <Card className="p-5 shadow-sm border-accent">
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
      </Card>
    </div>
  );
};
