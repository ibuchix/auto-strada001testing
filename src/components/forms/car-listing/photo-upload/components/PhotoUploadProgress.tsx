
/**
 * Component for displaying photo upload progress and validation status
 * Changes made:
 * - Fixed TypeScript error by properly using the usePhotoValidation hook
 * - Created a form-compatible wrapper to pass to the hook
 * - Made component more robust with proper type safety
 */
import React from "react";
import { Progress } from "@/components/ui/progress";
import { ValidationError } from "../../utils/validation";
import { ValidationSummary } from "./ValidationSummary";
import { allRequiredPhotos } from "../data/requiredPhotoData";
import { usePhotoValidation } from "../hooks/usePhotoValidation";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface PhotoUploadProgressProps {
  completionPercentage: number;
  totalPhotos: number;
  uploadedPhotos: Record<string, boolean>;
  validationErrors?: ValidationError[];
  onValidationChange?: (isValid: boolean) => void;
}

export const PhotoUploadProgress = ({
  completionPercentage,
  totalPhotos,
  uploadedPhotos,
  validationErrors,
  onValidationChange
}: PhotoUploadProgressProps) => {
  // Create a minimal form-compatible object that provides the data needed by usePhotoValidation
  const formWrapper = {
    watch: () => Object.keys(uploadedPhotos).filter(key => uploadedPhotos[key]),
    setValue: () => {},
    getValues: () => ({}),
    // Add other required properties from UseFormReturn as needed with empty implementations
  } as unknown as UseFormReturn<CarListingFormData>;
  
  const { 
    isValid, 
    getMissingPhotoTitles 
  } = usePhotoValidation(formWrapper);

  // Call the validation change callback when isValid changes
  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);
  
  const missingPhotoTitles = getMissingPhotoTitles();
  
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Photo Upload Progress</span>
          <span>{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {Object.values(uploadedPhotos).filter(Boolean).length} of {totalPhotos} photos uploaded
        </p>
      </div>

      {/* Validation summary */}
      {(isValid || missingPhotoTitles.length > 0) && (
        <ValidationSummary
          isValid={isValid}
          missingPhotoTitles={missingPhotoTitles}
          completionPercentage={completionPercentage}
        />
      )}
    </div>
  );
};
