
/**
 * Component for displaying photo upload progress
 */
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormValidationSummary } from "../../validation/FormValidationSummary";
import { ValidationError } from "../../utils/validation";

interface PhotoUploadProgressProps {
  completionPercentage: number;
  totalPhotos: number;
  validationErrors: ValidationError[];
}

export const PhotoUploadProgress = ({
  completionPercentage,
  totalPhotos,
  validationErrors
}: PhotoUploadProgressProps) => {
  const completedPhotos = totalPhotos - validationErrors.length;
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Photo Upload Progress</div>
        <div className="text-sm text-gray-600">
          {completionPercentage}% complete ({completedPhotos}/{totalPhotos})
        </div>
      </div>
      
      <Progress value={completionPercentage} className="h-2" />
      
      <div className="mt-4">
        {validationErrors.length > 0 ? (
          <FormValidationSummary 
            errors={validationErrors} 
          />
        ) : (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="ml-2 text-green-700">
              All required photos have been uploaded. You can proceed to the next step.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};
