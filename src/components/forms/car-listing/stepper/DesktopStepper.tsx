
/**
 * DesktopStepper Component
 * Renders a full-featured stepper for desktop screens
 */

import { StepCircle } from './StepCircle';
import { StepLabel } from './StepLabel';
import { StepConnector } from './StepConnector';
import { useStepperAccessibility } from './useStepperAccessibility';

export interface StepItem {
  id: string;
  title: string;
  sections: string[];
  description?: string;
}

interface DesktopStepperProps {
  steps: StepItem[];
  currentStep: number;
  completedSteps: number[];
  validationErrors: Record<string, boolean>;
  visibleSections: string[];
  onStepChange: (step: number) => void;
}

export const DesktopStepper = ({
  steps,
  currentStep,
  completedSteps,
  validationErrors,
  visibleSections,
  onStepChange
}: DesktopStepperProps) => {
  const { 
    isStepAccessible, 
    createStepClickHandler, 
    createStepKeyDownHandler 
  } = useStepperAccessibility({
    currentStep,
    completedSteps,
    visibleSections
  });

  return (
    <ol role="list" className="hidden md:flex items-center justify-between max-w-5xl mx-auto">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.includes(index);
        const isAccessible = isStepAccessible(step.id, step.sections, index);
        const hasError = validationErrors[step.id];
        
        return (
          <li key={step.id} className="relative flex-shrink-0 flex flex-col items-center w-[120px]">
            {/* Connection line between steps */}
            {index !== steps.length - 1 && (
              <StepConnector isCompleted={isCompleted} />
            )}
            
            <div className="group flex flex-col items-center">
              {/* Step circle */}
              <StepCircle
                index={index}
                isActive={isActive}
                isCompleted={isCompleted}
                isAccessible={isAccessible}
                hasError={hasError}
                stepTitle={step.title}
                stepDescription={step.description}
                onClick={createStepClickHandler(index, isAccessible, onStepChange)}
                onKeyDown={createStepKeyDownHandler(index, isAccessible, onStepChange)}
              />
              
              {/* Step label */}
              <StepLabel
                title={step.title}
                isActive={isActive}
                isCompleted={isCompleted}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
};
