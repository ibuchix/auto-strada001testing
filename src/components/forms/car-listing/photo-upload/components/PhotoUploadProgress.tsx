
/**
 * Component for displaying photo upload progress and validation status
 */
import { Progress } from "@/components/ui/progress";
import { ValidationError } from "../../utils/validation";
import { ValidationSummary } from "./ValidationSummary";
import { allRequiredPhotos } from "../data/requiredPhotoData";
import { usePhotoValidation } from "../hooks/usePhotoValidation";

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
  const { 
    isValid, 
    getMissingPhotoTitles 
  } = usePhotoValidation({ 
    uploadedPhotos,
    onValidationChange 
  });

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
