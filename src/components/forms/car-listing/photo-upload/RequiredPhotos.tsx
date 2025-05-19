
/**
 * Changes made:
 * - Added validation to ensure all required photos are uploaded
 * - Added ValidationSummary component to display validation status
 * - Integrated with onValidationChange callback for form integration
 * - Updated to display validation errors when trying to proceed
 * - Maintained all original functionality while adding validation
 * - Restyled to match brand guidelines with a single required indicator per section
 * - Enhanced visual styling with cards and brand colors
 * - Improved spacing and typography
 * - 2025-04-05: Updated to handle the non-optional required property in PhotoItem
 * - 2025-04-06: Harmonized with app design system
 * - 2025-05-20: Updated to use direct uploads for immediate processing
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
  carId?: string;
}

export const RequiredPhotos = ({ 
  isUploading, 
  progress, 
  onFileSelect,
  onValidationChange,
  carId
}: RequiredPhotosProps) => {
  const {
    uploadedPhotos,
    activeUploads,
    handlePhotoUploaded,
    handleUploadError,
    handleUploadRetry,
    getCompletionPercentage,
    setActiveUpload,
    uploadRequiredPhoto
  } = useRequiredPhotosUpload({ 
    onValidationChange,
    carId
  });
  
  // Generate validation errors for displaying in summary
  const validationErrors: ValidationError[] = allRequiredPhotos
    .filter(photo => photo.required && !uploadedPhotos[photo.id])
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
    
    // Delegate to the provided onFileSelect function
    const result = await onFileSelect(file, type);
    
    // If the upload was successful, mark the photo as uploaded
    if (result) {
      handlePhotoUploaded(type);
    }
    
    return result;
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-accent pb-4">
        <h3 className="text-2xl font-kanit font-semibold text-body">Required Photos</h3>
        <p className="text-subtitle mt-1 text-sm">
          Please upload clear photos of your vehicle to help dealers assess its condition
        </p>
      </div>
      
      {/* Validation summary and progress indicator */}
      <PhotoUploadProgress
        completionPercentage={completionPercentage}
        totalPhotos={allRequiredPhotos.length}
        uploadedPhotos={uploadedPhotos}
        validationErrors={validationErrors}
        onValidationChange={onValidationChange}
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
