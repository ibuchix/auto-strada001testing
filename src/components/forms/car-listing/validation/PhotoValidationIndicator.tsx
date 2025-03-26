
/**
 * Component for displaying photo upload validation states
 * - 2027-08-12: Created component to provide better upload validation feedback
 */
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Uploaded</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{photoType} successfully uploaded</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (isRequired && !isUploaded) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1 cursor-pointer"
              onClick={onRetry}
            >
              <AlertCircle className="h-3 w-3" />
              <span>Required</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{photoType} is required before submission</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};
