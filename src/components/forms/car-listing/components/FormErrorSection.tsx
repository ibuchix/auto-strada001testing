
/**
 * Form Error Section component
 * - Extracted from FormContent.tsx to separate error display logic
 * - Fixed type mismatch between ValidationErrorDisplay and FormErrorSection props
 * - 2025-11-21: Added proper type handling for validation errors
 * - 2028-05-15: Enhanced error display with debugging information
 * - 2028-05-15: Added collapsible error details for developers
 * - 2028-06-10: Added support for error severity levels and improved UI
 */
import { memo, useState } from "react";
import { ValidationErrorDisplay } from "../ValidationErrorDisplay";
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { ValidationSeverity, EnhancedValidationResult } from "../utils/validation";

interface FormErrorSectionProps {
  validationErrors: Record<number, string[]> | Record<number, EnhancedValidationResult[]>;
  showDetails?: boolean; // Whether to show detailed error information
  allowContinueWithWarnings?: boolean; // Whether to show continue anyway button
  onContinueAnyway?: () => void; // Callback for continue anyway button
}

export const FormErrorSection = memo(({
  validationErrors,
  showDetails = false,
  allowContinueWithWarnings = false,
  onContinueAnyway
}: FormErrorSectionProps) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Log validation errors for debugging
  console.log("[FormErrorSection] Validation errors:", validationErrors);
  
  // Process validation errors by severity if they're enhanced errors
  const processedErrors = {
    critical: [] as string[],
    warning: [] as string[],
    info: [] as string[]
  };
  
  let hasEnhancedErrors = false;
  let hasCriticalErrors = false;

  // Process and categorize errors by severity
  Object.values(validationErrors).forEach(stepErrors => {
    if (!Array.isArray(stepErrors)) return;
    
    stepErrors.forEach(error => {
      if (typeof error === 'string') {
        // Handle legacy string errors as critical
        processedErrors.critical.push(error);
      } else if (error && typeof error === 'object') {
        // Handle enhanced validation results with severity
        if ('severity' in error) {
          hasEnhancedErrors = true;
          const message = error.message;
          
          switch (error.severity) {
            case ValidationSeverity.CRITICAL:
              hasCriticalErrors = true;
              processedErrors.critical.push(message);
              break;
            case ValidationSeverity.WARNING:
              processedErrors.warning.push(message);
              break;
            case ValidationSeverity.INFO:
              processedErrors.info.push(message);
              break;
            default:
              processedErrors.critical.push(message);
          }
        } else if ('field' in error && 'message' in error) {
          // For standard validation results without severity
          processedErrors.critical.push(error.message);
        }
      }
    });
  });
  
  // Only render if there are any errors
  const hasErrors = 
    processedErrors.critical.length > 0 || 
    processedErrors.warning.length > 0 || 
    processedErrors.info.length > 0;
  
  if (!hasErrors) {
    console.log("[FormErrorSection] No validation errors to display");
    return null;
  }
  
  // If not using enhanced errors, get all errors as a flat array for backward compatibility
  const flattenedErrors: string[] = hasEnhancedErrors
    ? []
    : Object.values(validationErrors)
        .flat()
        .filter(error => typeof error === 'string') as string[];
  
  console.log("[FormErrorSection] Displaying validation errors:", {
    critical: processedErrors.critical,
    warning: processedErrors.warning,
    info: processedErrors.info,
    legacy: flattenedErrors
  });
  
  return (
    <div className="mb-6">
      {/* Legacy error display for backward compatibility */}
      {!hasEnhancedErrors && flattenedErrors.length > 0 && (
        <ValidationErrorDisplay errors={flattenedErrors} />
      )}
      
      {/* Enhanced error display with severity levels */}
      {hasEnhancedErrors && (
        <>
          {/* Critical errors */}
          {processedErrors.critical.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium">Please fix the following errors:</h3>
              </div>
              <ul className="mt-2 ml-6 list-disc text-sm">
                {processedErrors.critical.map((error, index) => (
                  <li key={`error-critical-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Warning errors */}
          {processedErrors.warning.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="font-medium">Warnings:</h3>
              </div>
              <ul className="mt-2 ml-6 list-disc text-sm">
                {processedErrors.warning.map((error, index) => (
                  <li key={`error-warning-${index}`}>{error}</li>
                ))}
              </ul>
              
              {/* Continue anyway button for warnings */}
              {allowContinueWithWarnings && !hasCriticalErrors && onContinueAnyway && (
                <div className="mt-3 flex justify-end">
                  <button 
                    type="button"
                    onClick={onContinueAnyway}
                    className="text-sm px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition-colors"
                  >
                    Continue anyway
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Info messages */}
          {processedErrors.info.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 mb-3">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Information:</h3>
              </div>
              <ul className="mt-2 ml-6 list-disc text-sm">
                {processedErrors.info.map((error, index) => (
                  <li key={`error-info-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      
      {/* Debug information */}
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
