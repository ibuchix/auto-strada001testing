
/**
 * A component to display validation summary for photo uploads
 */
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationSummaryProps {
  isValid: boolean;
  missingPhotoTitles: string[];
  completionPercentage: number;
}

export const ValidationSummary = ({ 
  isValid, 
  missingPhotoTitles, 
  completionPercentage 
}: ValidationSummaryProps) => {
  if (isValid) {
    return (
      <Alert className="bg-green-50 border-green-200 mb-6">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-700">All required photos uploaded</AlertTitle>
        <AlertDescription className="text-green-600">
          You've successfully uploaded all required photos. You can proceed to the next step.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing required photos</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>Please upload the following required photos:</p>
          <ul className="list-disc pl-5">
            {missingPhotoTitles.map((title, index) => (
              <li key={index}>{title}</li>
            ))}
          </ul>
          <p className="text-sm mt-2">
            Progress: {completionPercentage}% complete
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
