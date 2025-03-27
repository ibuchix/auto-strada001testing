
/**
 * Changes made:
 * - Fixed step coloring issue for steps after current step (especially for step 6)
 * - Completely redesigned step label positioning to eliminate overlapping text
 * - Added fixed width containers for each step to ensure proper spacing
 * - Improved mobile view for better readability
 * - Fixed accessibility state handling for all steps
 */

import { useCallback } from 'react';
import { Check } from 'lucide-react';
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
  const isStepAccessible = useCallback((stepId: string) => {
    return visibleSections.includes(stepId);
  }, [visibleSections]);

  return (
    <nav aria-label="Progress" className="py-6">
      <ol role="list" className="hidden md:flex items-center">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = isStepAccessible(step.id);
          
          return (
            <li key={step.id} className={cn(
              "relative",
              index !== steps.length - 1 ? "flex-1 pr-8" : "",
              "flex-shrink-0 w-full max-w-[140px]"
            )}>
              {/* Connection line between steps */}
              {index !== steps.length - 1 && (
                <div className="absolute top-5 left-7 w-full h-0.5" aria-hidden="true">
                  <div className={cn(
                    "h-0.5 w-full max-w-[80px]",
                    isCompleted ? "bg-[#DC143C]" : "bg-gray-200"
                  )} />
                </div>
              )}
              
              <div className="group relative flex flex-col items-start">
                {/* Step circle */}
                <span className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isAccessible && onStepChange(index)}
                    disabled={!isAccessible}
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      isCompleted 
                        ? "bg-[#DC143C] hover:bg-[#DC143C]/90" 
                        : isActive 
                          ? "bg-[#DC143C] text-white"
                          : isAccessible 
                            ? "bg-white border-2 border-[#DC143C] hover:border-[#DC143C]/80"
                            : "bg-white border-2 border-gray-300",
                      "transition-colors focus:outline-none focus:ring-2 focus:ring-[#DC143C]/40 focus:ring-offset-2"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <span className={cn(
                        "text-sm font-semibold", 
                        isActive ? "text-white" : isAccessible ? "text-[#DC143C]" : "text-gray-500"
                      )}>
                        {index + 1}
                      </span>
                    )}
                    <span className="sr-only">{step.title}</span>
                  </button>
                </span>
                
                {/* Step label - positioned below with fixed width */}
                <span className="mt-3 block w-32 text-center" style={{ marginLeft: "-11px" }}>
                  <span className={cn(
                    "text-xs font-medium whitespace-normal",
                    isActive 
                      ? "text-[#DC143C] font-semibold" 
                      : isCompleted 
                        ? "text-gray-900" 
                        : "text-gray-500"
                  )}>
                    {step.title}
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      
      {/* Mobile view - improved for better readability */}
      <div className="md:hidden">
        <div className="flex items-center space-x-2 mb-4 justify-center">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={cn(
                "h-2 rounded-full",
                index === currentStep 
                  ? "w-8 bg-[#DC143C]" 
                  : index < currentStep 
                    ? "w-4 bg-[#DC143C]/60" 
                    : "w-4 bg-gray-200"
              )}
            />
          ))}
        </div>
        <p className="text-sm font-medium text-center">
          Step {currentStep + 1} of {steps.length}: <span className="text-[#DC143C]">{steps[currentStep]?.title}</span>
        </p>
      </div>
    </nav>
  );
};
