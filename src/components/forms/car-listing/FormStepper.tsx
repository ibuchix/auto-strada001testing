
/**
 * New component:
 * - Created FormStepper component for step navigation
 * - Added support for visible sections tracking
 * - Implemented flexible step navigation interface
 */

import { useCallback } from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  visibleSections?: string[];
}

export const FormStepper = ({
  steps,
  currentStep,
  onStepChange,
  visibleSections = []
}: FormStepperProps) => {
  // Determine if a step is accessible based on visible sections
  const isStepAccessible = useCallback((stepId: string) => {
    return visibleSections.includes(stepId);
  }, [visibleSections]);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = isStepAccessible(step.id);
          
          return (
            <li key={step.id} className={cn(
              "relative flex-1",
              index !== steps.length - 1 ? "pr-8 sm:pr-20" : ""
            )}>
              {/* Step Connector */}
              {index !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={cn(
                    "h-0.5 w-full",
                    isCompleted ? "bg-[#DC143C]" : "bg-gray-200"
                  )} />
                </div>
              )}
              
              <button
                type="button"
                onClick={() => isAccessible && onStepChange(index)}
                disabled={!isAccessible}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full",
                  isCompleted 
                    ? "bg-[#DC143C] hover:bg-[#DC143C]/90" 
                    : isActive 
                      ? "bg-[#DC143C] text-white"
                      : isAccessible 
                        ? "bg-white border-2 border-[#DC143C] hover:border-[#DC143C]/80"
                        : "bg-white border-2 border-gray-300",
                  "transition-colors focus:outline-none focus:ring-2 focus:ring-[#DC143C]/40 focus:ring-offset-2"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                ) : (
                  <span 
                    className={cn(
                      "text-sm font-semibold", 
                      isActive ? "text-white" : isAccessible ? "text-[#DC143C]" : "text-gray-500"
                    )}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="sr-only">{step.title}</span>
              </button>
              
              {/* Step Title */}
              <div className="hidden absolute top-10 sm:flex sm:flex-col sm:items-center w-max transform -translate-x-1/2 left-1/2">
                <span 
                  className={cn(
                    "text-sm font-medium",
                    isActive ? "text-[#DC143C]" : isCompleted ? "text-gray-900" : "text-gray-500"
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-xs text-gray-500">{step.description}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
