
/**
 * Component to display a summary of form validation issues
 * - 2027-08-12: Created component to provide better form validation feedback
 */
import { useState } from "react";
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ValidationError } from "@/components/forms/car-listing/utils/validation";

interface FormValidationSummaryProps {
  errors: ValidationError[];
  onNavigateToSection?: (section: string) => void;
}

export const FormValidationSummary = ({ 
  errors, 
  onNavigateToSection 
}: FormValidationSummaryProps) => {
  const [expanded, setExpanded] = useState(errors.length > 0);

  if (errors.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">All requirements met</AlertTitle>
        <AlertDescription className="text-green-700">
          Your form is complete and ready for submission
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="bg-red-50 border-red-200">
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">
              {errors.length} {errors.length === 1 ? "issue" : "issues"} need to be resolved
            </AlertTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-auto"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-red-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-red-600" />
            )}
          </Button>
        </div>
        
        {expanded && (
          <AlertDescription className="text-red-700 mt-2">
            <ScrollArea className="max-h-60">
              <ul className="space-y-2 mt-2">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0 text-red-600" />
                    <span>{error.message}</span>
                    {onNavigateToSection && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-auto text-[#DC143C]"
                        onClick={() => onNavigateToSection(error.field)}
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        <span className="text-xs">Fix</span>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </AlertDescription>
        )}
      </div>
    </Alert>
  );
};
