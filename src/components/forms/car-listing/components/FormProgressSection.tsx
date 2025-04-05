
/**
 * Form Progress Section component
 * - Extracted from FormContent.tsx to separate UI concerns
 * - 2025-04-08: Added progress prop to fix type errors
 * - 2025-04-09: Improved props passing and fixed progress indicator
 */
import { memo } from "react";
import { FormProgressIndicator } from "./FormProgressIndicator";

interface FormProgressSectionProps {
  currentStep: number;
  lastSaved: Date | null;
  onOfflineStatusChange: (status: boolean) => void;
  steps: any[];
  visibleSections: string[];
  completedSteps: number[];
  validationErrors: Record<string, boolean>;
  onStepChange: (step: number) => void;
  progress?: number;
}

export const FormProgressSection = memo(({
  currentStep,
  lastSaved,
  onOfflineStatusChange,
  steps,
  visibleSections,
  completedSteps,
  validationErrors,
  onStepChange,
  progress
}: FormProgressSectionProps) => {
  return (
    <div className="mb-8">
      <FormProgressIndicator 
        steps={steps} 
        currentStep={currentStep} 
        onStepChange={onStepChange}
        visibleSections={visibleSections}
        completedSteps={completedSteps}
        validationErrors={validationErrors}
        lastSaved={lastSaved}
        onOfflineChange={onOfflineStatusChange}
        totalSteps={steps.length}
        progress={progress}
      />
    </div>
  );
});

FormProgressSection.displayName = 'FormProgressSection';
