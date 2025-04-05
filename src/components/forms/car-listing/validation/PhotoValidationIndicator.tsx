
/**
 * Component for displaying photo upload validation states
 * - 2027-08-12: Created component to provide better upload validation feedback
 * - 2028-09-21: Fixed tooltip implementation
 * - 2025-04-05: Enhanced with improved visual styling and clearer status messages
 * - 2025-04-05: Fixed tooltip component usage to match the correct API
 * - 2025-04-05: Added retry functionality for required photos
 * - 2025-04-05: Added option to hide required label for section-level required indicators
 * - 2025-04-05: Updated with brand styling and improved visual hierarchy
 * - 2025-04-05: Added animations and hover effects
 */
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface PhotoValidationIndicatorProps {
  isUploaded: boolean;
  isRequired: boolean;
  photoType: string;
  onRetry?: () => void;
  hideRequiredLabel?: boolean;
}

export const PhotoValidationIndicator = ({
  isUploaded,
  isRequired,
  photoType,
  onRetry,
  hideRequiredLabel = false
}: PhotoValidationIndicatorProps) => {
  if (!isRequired && !isUploaded) {
    return null;
  }

  if (isUploaded) {
    return (
      <Tooltip content={`${photoType} successfully uploaded`}>
        <Badge 
          className="bg-success hover:bg-success/90 flex items-center gap-1 text-white transition-all duration-300 animate-fade-in shadow-sm group"
        >
          <CheckCircle className="h-3 w-3 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-kanit text-xs">Uploaded</span>
        </Badge>
      </Tooltip>
    );
  }

  if (isRequired && !isUploaded && !hideRequiredLabel) {
    return (
      <Tooltip content={`${photoType} is required before submission`}>
        <Badge 
          className={cn(
            "flex items-center gap-1 cursor-pointer text-white shadow-sm transition-all duration-300 animate-fade-in group",
            onRetry 
              ? "bg-amber-500 hover:bg-amber-600" 
              : "bg-primary hover:bg-primary/90"
          )}
          onClick={onRetry}
        >
          {onRetry ? (
            <RefreshCw className="h-3 w-3 transition-transform duration-300 group-hover:rotate-45" />
          ) : (
            <AlertCircle className="h-3 w-3 transition-transform duration-300 group-hover:scale-110" />
          )}
          <span className="font-kanit text-xs">Required</span>
        </Badge>
      </Tooltip>
    );
  }

  return null;
};

