
/**
 * Changes made:
 * - Refactored into smaller components for better maintainability
 * - Extracted Step Circle, Step Label, and Step Connector into separate components
 * - Created separate Desktop and Mobile stepper components
 * - Added accessibility utility hook
 * - Improved code organization and readability
 */

import { useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { formSteps } from './constants/formSteps';
import { DesktopStepper } from './stepper/DesktopStepper';
import { MobileStepper } from './stepper/MobileStepper';

export interface StepperProps {
  steps: typeof formSteps;
  currentStep: number;
  onStepChange: (step: number) => void;
  visibleSections?: string[];
  completedSteps?: number[];
  validationErrors?: Record<string, boolean>;
}

export const FormStepper = ({
  steps,
  currentStep,
  onStepChange,
  visibleSections = [],
  completedSteps = [],
  validationErrors = {}
}: StepperProps) => {
  // Filter steps based on visibility of their sections
  const filteredSteps = useCallback(() => {
    return steps.filter(step => {
      return step.sections.some(section => visibleSections.includes(section));
    });
  }, [steps, visibleSections]);

  const visibleSteps = filteredSteps();

  return (
    <TooltipProvider>
      <nav aria-label="Form Progress" className="py-6">
        {/* Desktop Stepper */}
        <DesktopStepper
          steps={visibleSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          validationErrors={validationErrors}
          visibleSections={visibleSections}
          onStepChange={onStepChange}
        />
        
        {/* Mobile Stepper */}
        <MobileStepper
          steps={visibleSteps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          stepErrors={validationErrors}
        />
      </nav>
    </TooltipProvider>
  );
};
