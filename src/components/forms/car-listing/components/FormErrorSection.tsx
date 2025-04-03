
/**
 * Updated FormErrorSection to work with fixed validation types
 * - 2025-04-03: Fixed import issues with EnhancedValidationResult
 */
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { memo } from "react";

interface FormErrorSectionProps {
  validationErrors: Record<number, string[]>;
  showDetails?: boolean;
}

export const FormErrorSection = memo(({ validationErrors, showDetails = false }: FormErrorSectionProps) => {
  // Count total errors across all steps
  const totalErrors = Object.values(validationErrors).reduce(
    (count, stepErrors) => count + stepErrors.length,
    0
  );
  
  if (totalErrors === 0) return null;
  
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Errors</AlertTitle>
      <AlertDescription className="flex flex-col space-y-2">
        <p>Please fix the following issues to proceed:</p>
        
        {showDetails && (
          <div className="mt-2 text-sm">
            {Object.entries(validationErrors).map(([stepIndex, errors]) => (
              errors.length > 0 && (
                <div key={stepIndex} className="mb-2">
                  <p className="font-semibold">Step {parseInt(stepIndex) + 1}:</p>
                  <ul className="list-disc pl-5">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
});

FormErrorSection.displayName = 'FormErrorSection';
