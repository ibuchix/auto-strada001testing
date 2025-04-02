
/**
 * Changes made:
 * - 2024-06-20: Extracted progress section from FormContent.tsx
 * - Created a standalone component for progress visualization
 */

import { FormProgressIndicator } from "./FormProgressIndicator";
import { ProgressPreservation } from "../submission/ProgressPreservation";

interface FormProgressSectionProps {
  currentStep: number;
  lastSaved: Date | null;
  onOfflineStatusChange: (status: boolean) => void;
  steps: any[];
  visibleSections: string[];
  completedSteps: number[];
  validationErrors: Record<string, boolean>;
  onStepChange: (step: number) => void;
}

export const FormProgressSection = ({
  currentStep,
  lastSaved,
  onOfflineStatusChange,
  steps,
  visibleSections,
  completedSteps,
  validationErrors,
  onStepChange
}: FormProgressSectionProps) => {
  return (
    <>
      <ProgressPreservation 
        currentStep={currentStep}
        lastSaved={lastSaved}
        onOfflineStatusChange={onOfflineStatusChange}
      />
      
      <FormProgressIndicator 
        steps={steps}
        currentStep={currentStep}
        onStepChange={onStepChange}
        visibleSections={visibleSections}
        completedSteps={completedSteps}
        validationErrors={validationErrors}
      />
    </>
  );
};
