
/**
 * Form Error Section component
 * - Extracted from FormContent.tsx to separate error display logic
 * - Fixed type mismatch between ValidationErrorDisplay and FormErrorSection props
 * - 2025-11-21: Added proper type handling for validation errors
 * - 2028-05-15: Enhanced error display with debugging information
 * - 2028-05-15: Added collapsible error details for developers
 */
import { memo, useState } from "react";
import { ValidationErrorDisplay } from "../ValidationErrorDisplay";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FormErrorSectionProps {
  validationErrors: Record<number, string[]>;
  showDetails?: boolean; // Whether to show detailed error information
}

export const FormErrorSection = memo(({
  validationErrors,
  showDetails = false
}: FormErrorSectionProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Log validation errors for debugging
  console.log("[FormErrorSection] Validation errors:", validationErrors);
  
  // Only render if there are any errors
  const hasErrors = Object.values(validationErrors).some(
    errors => Array.isArray(errors) && errors.length > 0
  );
  
  if (!hasErrors) {
    console.log("[FormErrorSection] No validation errors to display");
    return null;
  }
  
  // Convert the Record<number, string[]> to a flat string[] for ValidationErrorDisplay
  const flattenedErrors: string[] = Object.values(validationErrors)
    .flat()
    .filter(error => typeof error === 'string');
  
  console.log("[FormErrorSection] Displaying validation errors:", flattenedErrors);
  
  return (
    <div className="mb-6">
      <ValidationErrorDisplay errors={flattenedErrors} />
      
      {showDetails && (
        <div className="mt-2">
          <button 
            type="button"
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="text-xs flex items-center text-muted-foreground hover:text-foreground"
          >
            {isDetailsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="ml-1">
              {isDetailsOpen ? "Hide error details" : "Show error details"}
            </span>
          </button>
          
          {isDetailsOpen && (
            <pre className="mt-2 p-2 bg-muted/30 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(validationErrors, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
});

FormErrorSection.displayName = 'FormErrorSection';
