
/**
 * A component to display validation summary for photo uploads
 * - 2025-04-05: Styled with brand colors and improved visual hierarchy
 * - 2025-04-05: Added motion effects for better user experience
 * - 2025-04-05: Improved content organization and responsive layout
 * - 2025-04-06: Updated to match app design language and typography
 */
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

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
      <Alert 
        className="bg-success/10 border-success/20 mb-6 transition-all duration-300 transform hover:border-success/30 shadow-sm"
      >
        <CheckCircle className="h-4 w-4 text-success animate-pulse" />
        <AlertTitle className="text-success font-kanit">All required photos uploaded</AlertTitle>
        <AlertDescription className="text-success/80 font-kanit">
          You've successfully uploaded all required photos. You can proceed to the next step.
        </AlertDescription>
      </Alert>
    );
  }

  // Get completion status text based on percentage
  const getCompletionStatus = () => {
    if (completionPercentage === 0) return "Not started";
    if (completionPercentage < 30) return "Just started";
    if (completionPercentage < 60) return "In progress";
    if (completionPercentage < 90) return "Almost there";
    return "Nearly complete";
  };

  return (
    <Alert 
      variant="destructive" 
      className="mb-6 bg-primary/10 border-primary/20 hover:border-primary/30 transition-all duration-300 shadow-sm"
    >
      <AlertCircle className="h-4 w-4 text-primary animate-pulse" />
      <AlertTitle className="text-primary font-oswald">Missing required photos</AlertTitle>
      <AlertDescription className="text-subtitle">
        <div className="space-y-3">
          <p className="font-kanit">Please upload the following required photos:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {missingPhotoTitles.map((title, index) => (
              <li key={index} className="text-primary/90">{title}</li>
            ))}
          </ul>
          <div className="text-xs pt-1 border-t border-primary/10 mt-2 flex justify-between items-center">
            <span className="text-subtitle font-kanit">
              {getCompletionStatus()} - {completionPercentage}% complete
            </span>
            
            <span className={cn(
              "px-2 py-0.5 rounded-full font-kanit",
              completionPercentage > 70 
                ? "bg-amber-500/10 text-amber-600" 
                : "bg-primary/10 text-primary/80"
            )}>
              {missingPhotoTitles.length} remaining
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
