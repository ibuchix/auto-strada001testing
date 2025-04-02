
/**
 * Form Progress Section component
 * - Extracted from FormContent.tsx to separate UI concerns
 */
import { memo } from "react";
import { FormProgressIndicator } from "../FormProgressIndicator";

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

export const FormProgressSection = memo(({
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
    <div className="mb-8">
      <FormProgressIndicator 
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        lastSaved={lastSaved}
        onOfflineChange={onOfflineStatusChange}
        visibleSections={visibleSections}
        completedSteps={completedSteps}
        validationErrors={validationErrors}
        onStepChange={onStepChange}
      />
    </div>
  );
});

FormProgressSection.displayName = 'FormProgressSection';
