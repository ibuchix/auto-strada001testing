
/**
 * Changes made:
 * - 2027-07-24: Added support for diagnosticId prop for improved debugging
 * - 2027-07-25: Fixed issue with formSteps component access
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { Fragment } from "react";

interface FormSectionsProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  carId?: string;
  userId: string;
  diagnosticId?: string; 
}

export const FormSections = ({ 
  form, 
  currentStep, 
  carId,
  userId,
  diagnosticId
}: FormSectionsProps) => {
  // Get the current step component
  const CurrentStepComponent = formSteps[currentStep]?.component;
  
  if (!CurrentStepComponent) {
    return <div>Invalid step</div>;
  }
  
  return (
    <div className="form-section my-6">
      <CurrentStepComponent 
        form={form} 
        carId={carId} 
        userId={userId}
        diagnosticId={diagnosticId} 
      />
    </div>
  );
};
