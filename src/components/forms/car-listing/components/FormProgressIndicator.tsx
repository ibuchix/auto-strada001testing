
/**
 * Form Progress Indicator component
 * - Extracted from FormProgressSection.tsx to separate UI concerns
 * - 2025-04-09: Added progress prop for completion percentage display
 */

import { FormStepper } from "../FormStepper";

interface FormProgressIndicatorProps {
  steps: any[];
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  visibleSections: string[];
  completedSteps: number[];
  validationErrors: Record<string, boolean>;
  description?: string;
  lastSaved?: Date | null;
  onOfflineChange?: (status: boolean) => void;
  progress?: number; // Added progress prop
}

export const FormProgressIndicator = ({
  steps,
  currentStep,
  totalSteps,
  onStepChange,
  visibleSections,
  completedSteps,
  validationErrors,
  description,
  lastSaved,
  onOfflineChange,
  progress // Add to destructuring
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
