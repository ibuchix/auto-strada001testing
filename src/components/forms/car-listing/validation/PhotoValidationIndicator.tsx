
/**
 * Component for displaying photo upload validation states
 * - 2027-08-12: Created component to provide better upload validation feedback
 * - 2028-09-21: Fixed tooltip implementation
 * - 2025-04-05: Enhanced with improved visual styling and clearer status messages
 * - 2025-04-05: Fixed tooltip component usage to match the correct API
 */
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";

interface PhotoValidationIndicatorProps {
  isUploaded: boolean;
  isRequired: boolean;
  photoType: string;
  onRetry?: () => void;
}

export const PhotoValidationIndicator = ({
  isUploaded,
  isRequired,
  photoType,
  onRetry
}: PhotoValidationIndicatorProps) => {
  if (!isRequired && !isUploaded) {
    return null;
  }

  if (isUploaded) {
    return (
      <Tooltip content={`${photoType} successfully uploaded`}>
        <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Uploaded</span>
        </Badge>
      </Tooltip>
    );
  }

  if (isRequired && !isUploaded) {
    return (
      <Tooltip content={`${photoType} is required before submission`}>
        <Badge 
          className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1 cursor-pointer"
          onClick={onRetry}
        >
          <AlertCircle className="h-3 w-3" />
          <span>Required</span>
        </Badge>
      </Tooltip>
    );
  }

  return null;
};
