
/**
 * Changes made:
 * - 2027-07-24: Updated component props type issue by using conditional prop passing
 * - 2027-07-25: Fixed issue with formSteps component access
 * - 2027-07-26: Fixed component props type issue by using conditional prop passing
 * - 2027-08-01: Updated component detection to handle more component types
 * - Removed diagnostic-related code
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";

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
  // Get the current step component
  const CurrentStepComponent = formSteps[currentStep]?.component;
  
  if (!CurrentStepComponent) {
    return <div>Invalid step</div>;
  }
  
  // Define the base props that all components receive
  const baseProps = { form };
  
  // Determine which additional props to pass based on the component's name
  const additionalProps: Record<string, any> = {};
  
  // Components that need carId
  if (['DamageSection', 'RimPhotosSection', 'WarningLightsSection', 'PhotoUploadSection', 'ServiceHistorySection'].includes(CurrentStepComponent.name)) {
    additionalProps.carId = carId;
  }
  
  // Components that need userId (if any)
  if (CurrentStepComponent.name === 'SomeComponentThatNeedsUserId') {
    additionalProps.userId = userId;
  }
  
  return (
    <div className="form-section my-6">
      <CurrentStepComponent 
        {...baseProps} 
        {...additionalProps}
      />
    </div>
  );
};
