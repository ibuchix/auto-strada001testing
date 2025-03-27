
/**
 * Changes made:
 * - Fixed step indicator spacing to prevent overlapping
 * - Improved mobile responsiveness
 * - Added proper spacing between step indicators
 * - Fixed subtitle positioning and alignment
 * - Improved visual hierarchy for active/completed steps
 * - Enhanced button accessibility with proper focus states
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
  // Determine if a step is accessible based on visible sections
  const isStepAccessible = useCallback((stepId: string) => {
    return visibleSections.includes(stepId);
  }, [visibleSections]);

  return (
    <nav aria-label="Progress" className="py-6">
      <ol role="list" className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = isStepAccessible(step.id);
          
          return (
            <li key={step.id} className={cn(
              "relative",
              index !== steps.length - 1 ? "flex-1" : ""
            )}>
              {/* Step Connector Line */}
              {index !== steps.length - 1 && (
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className={cn(
                    "h-0.5 w-full",
                    isCompleted ? "bg-[#DC143C]" : "bg-gray-200"
                  )} />
                </div>
              )}
              
              <div className="relative flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => isAccessible && onStepChange(index)}
                  disabled={!isAccessible}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full",
                    isCompleted 
                      ? "bg-[#DC143C] hover:bg-[#DC143C]/90" 
                      : isActive 
                        ? "bg-[#DC143C] text-white"
                        : isAccessible 
                          ? "bg-white border-2 border-[#DC143C] hover:border-[#DC143C]/80"
                          : "bg-white border-2 border-gray-300",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-[#DC143C]/40 focus:ring-offset-2 z-10"
                  )}
                  aria-current={isActive ? "step" : undefined}
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
                <div className="absolute top-14 w-32 text-center">
                  <span 
                    className={cn(
                      "text-sm font-medium whitespace-normal",
                      isActive ? "text-[#DC143C] font-semibold" : 
                      isCompleted ? "text-gray-900" : "text-gray-500"
                    )}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1 whitespace-normal">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      
      {/* Mobile Stepper - Simplified for smaller screens */}
      <div className="md:hidden flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-4">
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
