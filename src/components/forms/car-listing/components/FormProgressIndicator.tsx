
/**
 * Changes made:
 * - 2028-11-15: Extracted from StepForm.tsx to create a reusable progress indicator component
 */

import { FormStepper } from "../FormStepper";

interface FormProgressIndicatorProps {
  steps: any[];
  currentStep: number;
  onStepChange: (step: number) => void;
  visibleSections: string[];
  completedSteps: number[];
  validationErrors: Record<string, boolean>;
  description?: string;
}

export const FormProgressIndicator = ({
  steps,
  currentStep,
  onStepChange,
  visibleSections,
  completedSteps,
  validationErrors,
  description
}: FormProgressIndicatorProps) => {
  return (
    <>
      <div className="mb-6">
        <FormStepper 
          steps={steps} 
          currentStep={currentStep} 
          onStepChange={onStepChange}
          visibleSections={visibleSections}
          completedSteps={completedSteps}
          validationErrors={validationErrors}
        />
      </div>
      
      {description && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800">
            {description}
          </h3>
        </div>
      )}
    </>
  );
};
