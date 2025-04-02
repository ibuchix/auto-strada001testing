
/**
 * Changes made:
 * - 2024-06-20: Extracted progress section from FormContent.tsx
 * - Created a standalone component for progress visualization
 * - 2024-06-23: Fixed prop passing to prevent infinite re-renders
 * - 2024-06-24: Added useMemo for step description to avoid recomputation
 * - 2024-06-24: Added React.memo to prevent unnecessary rerenders
 */

import { useMemo } from "react";
import { FormProgressIndicator } from "./FormProgressIndicator";
import { ProgressPreservation } from "../submission/ProgressPreservation";
import { memo } from "react";

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
  // Memoize description to prevent re-renders
  const stepDescription = useMemo(() => {
    return steps[currentStep]?.description || undefined;
  }, [steps, currentStep]);

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
        description={stepDescription}
      />
    </>
  );
});

// Add display name for React DevTools
FormProgressSection.displayName = "FormProgressSection";
