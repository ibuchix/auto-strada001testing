
/**
 * Changes made:
 * - Updated validation functions to handle non-critical errors
 * - Improved TypeScript typing and validation flow
 * - Added support for continuing with warnings
 * - Added detailed error logging during validation
 * - 2027-11-19: Fixed TypeScript compatibility with validation functions
 * - 2028-06-12: Enhanced validation with severity levels and fallbacks
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps, FormStep } from "./constants/formSteps";
import { useState } from "react";
import { validateFormDataWithSeverity, ValidationSeverity } from "./utils/validation";

// Define required props for each step type
type StepComponentProps = {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
  userId?: string;
  onValidate?: () => Promise<boolean>;
  validationState?: {
    hasWarnings: boolean;
    hasCriticalErrors: boolean;
    continueWithWarnings: () => void;
  };
};

interface FormSectionsProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  carId?: string;
  userId: string;
}

export const FormSections = ({ 
  form, 
  currentStep, 
  carId,
  userId
}: FormSectionsProps) => {
  // Track if we're forcing continuation despite warnings
  const [forceContinue, setForceContinue] = useState<boolean>(false);
  
  // We need to cast formSteps to the correct type
  const steps = formSteps as FormStep[];
  const currentStepConfig = steps[currentStep];

  if (!currentStepConfig?.component) {
    return (
      <div className="form-section my-6 text-red-500">
        Invalid form step configuration
      </div>
    );
  }

  const CurrentStepComponent = currentStepConfig.component;
  
  // Determine required props from the form step configuration
  const requiredProps = currentStepConfig.requiredProps || [];
  
  // Build props object based on declared requirements in the form step
  const componentProps: StepComponentProps = {
    form,
    ...(requiredProps.includes('carId') && { carId }),
    ...(requiredProps.includes('userId') && { userId }),
  };

  // Add improved validation handler if configured
  if (currentStepConfig.validate) {
    componentProps.onValidate = async () => {
      try {
        console.log(`Starting validation for step ${currentStep}: ${currentStepConfig.id}`);
        
        // Get form data
        const formFields = form.getValues();
        
        // Run built-in validation if available
        const builtInValidationResult = await currentStepConfig.validate!(formFields);
        
        // If built-in validation fails, return early
        if (!builtInValidationResult) {
          console.log(`Built-in validation failed for step ${currentStep}`);
          return false;
        }
        
        // Run enhanced validation with severity handling
        const currentSection = currentStepConfig.sections[0]; // Use first section or improve to use all
        const validationResults = validateFormDataWithSeverity(formFields, currentSection);
        
        const hasCriticalErrors = validationResults.some(
          e => e.severity === ValidationSeverity.CRITICAL && !e.recoverable
        );
        
        const hasOnlyWarnings = validationResults.length > 0 && 
          !hasCriticalErrors && 
          validationResults.some(e => e.severity === ValidationSeverity.WARNING);
        
        console.log(`Validation results for step ${currentStep}:`, {
          hasCriticalErrors,
          hasOnlyWarnings,
          forceContinue,
          errors: validationResults
        });
        
        // Allow progression if:
        // 1. No errors at all, or
        // 2. Only warnings and forceContinue is true
        const canProgress = validationResults.length === 0 || 
          (hasOnlyWarnings && forceContinue);
        
        // Reset force continue for next validation
        if (canProgress && forceContinue) {
          setForceContinue(false);
        }
        
        return canProgress;
      } catch (error) {
        console.error(`Validation error in step ${currentStep}:`, error);
        return false;
      }
    };
    
    // Add validation state to allow the component to show continue anyway button
    componentProps.validationState = {
      hasWarnings: false, // Will be determined by the component
      hasCriticalErrors: false, // Will be determined by the component
      continueWithWarnings: () => {
        console.log("User chose to continue with warnings");
        setForceContinue(true);
      }
    };
  }

  return (
    <div className="form-section my-6">
      <CurrentStepComponent {...componentProps} />
    </div>
  );
};
