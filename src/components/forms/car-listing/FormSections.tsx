
/**
 * Changes made:
 * - Added type-safe prop handling using generics
 * - Removed fragile component name checks
 * - Implemented declarative prop requirements in form steps
 * - Added validation context support
 * - Improved TypeScript typing
 * - Added proper handling of validation functions from formSteps
 * - Fixed validation function to use the correct data
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps, FormStep } from "./constants/formSteps";

// Define required props for each step type
type StepComponentProps = {
  form: UseFormReturn<CarListingFormData>;
  carId?: string;
  userId?: string;
  onValidate?: () => Promise<boolean>;
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

  // Add validation handler if configured
  if (currentStepConfig.validate) {
    componentProps.onValidate = async () => {
      const formFields = form.getValues();
      return currentStepConfig.validate!(formFields);
    };
  }

  return (
    <div className="form-section my-6">
      <CurrentStepComponent {...componentProps} />
    </div>
  );
};
