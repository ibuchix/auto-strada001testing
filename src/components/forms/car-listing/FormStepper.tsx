
/**
 * Changes made:
 * - Enhanced accessibility for step navigation
 * - Improved mobile styling for better readability
 * - Added proper aria attributes for screen readers
 * - Fixed step access issues for certain steps
 * - Improved visual feedback for current and completed steps
 * - Added step descriptions for better user guidance
 * - Enhanced conditional step rendering based on visible sections
 */

import { useCallback } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formSteps } from './constants/formSteps';

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
  const filteredSteps = steps.filter(step => {
    return step.sections.some(section => visibleSections.includes(section));
  });
  
  // Modified isStepAccessible function to handle section visibility
  const isStepAccessible = useCallback((step: typeof formSteps[0], index: number) => {
    // Always make these specific steps accessible
    if (step.id === 'notes' || step.id === 'personal-details') {
      return true;
    }
    
    // For steps with multiple sections, check if any of their sections are visible
    if (Array.isArray(step.sections)) {
      const hasVisibleSection = step.sections.some(sectionId => 
        visibleSections.includes(sectionId)
      );
      
      // Require previous steps to be completed first (can only jump backward freely)
      const isPreviousStep = index <= currentStep;
      
      return hasVisibleSection && (isPreviousStep || completedSteps.includes(index - 1));
    }
    
    return false;
  }, [visibleSections, currentStep, completedSteps]);

  // Handlers for accessibility
  const handleStepClick = (index: number, isAccessible: boolean) => {
    if (isAccessible) {
      onStepChange(index);
    }
  };

  const handleStepKeyDown = (e: React.KeyboardEvent, index: number, isAccessible: boolean) => {
    if (isAccessible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onStepChange(index);
    }
  };

  return (
    <TooltipProvider>
      <nav aria-label="Form Progress" className="py-6">
        <ol role="list" className="hidden md:flex items-center justify-between max-w-5xl mx-auto">
          {filteredSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(index);
            const isAccessible = isStepAccessible(step, index);
            const hasError = validationErrors[step.id];
            
            return (
              <li key={step.id} className={cn(
                "relative",
                "flex-shrink-0 flex flex-col items-center",
                "w-[120px]"
              )}>
                {/* Connection line between steps */}
                {index !== filteredSteps.length - 1 && (
                  <div className="absolute top-5 left-10 w-full h-0.5" aria-hidden="true">
                    <div className={cn(
                      "h-0.5 w-[calc(100%-20px)]",
                      isCompleted ? "bg-[#DC143C]" : "bg-gray-200"
                    )} />
                  </div>
                )}
                
                <div className="group flex flex-col items-center">
                  {/* Step circle */}
                  <span className="flex h-10 items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleStepClick(index, isAccessible)}
                          onKeyDown={(e) => handleStepKeyDown(e, index, isAccessible)}
                          disabled={!isAccessible}
                          aria-current={isActive ? "step" : undefined}
                          aria-label={`Step ${index + 1}: ${step.title}${hasError ? ' (has errors)' : ''}`}
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#DC143C]/40 focus:ring-offset-2",
                            hasError ? "ring-2 ring-red-500" : "",
                            isCompleted 
                              ? "bg-[#DC143C] hover:bg-[#DC143C]/90" 
                              : isActive 
                                ? "bg-[#DC143C] text-white"
                                : isAccessible 
                                  ? "bg-white border-2 border-[#DC143C] hover:border-[#DC143C]/80"
                                  : "bg-white border-2 border-gray-300 cursor-not-allowed"
                          )}
                        >
                          {hasError && (
                            <AlertCircle className="h-5 w-5 text-red-500 absolute -top-1 -right-1 bg-white rounded-full" />
                          )}
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
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{step.title}</p>
                        {step.description && <p className="text-xs opacity-80">{step.description}</p>}
                        {hasError && <p className="text-red-500 text-xs">This step has errors</p>}
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  
                  {/* Step label - improved positioning with fixed width */}
                  <span className="mt-3 block text-center w-full px-2">
                    <span className={cn(
                      "text-xs font-medium",
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
            {filteredSteps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(index);
              const hasError = validationErrors[step.id];
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    hasError ? "bg-red-500" : "",
                    isActive 
                      ? "w-8 bg-[#DC143C]" 
                      : isCompleted 
                        ? "w-4 bg-[#DC143C]/60" 
                        : "w-4 bg-gray-200"
                  )}
                  aria-hidden="true"
                />
              );
            })}
          </div>
          
          <div className="text-center">
            <p className="text-sm font-medium">
              Step {currentStep + 1} of {filteredSteps.length}: <span className="text-[#DC143C]">{filteredSteps[currentStep]?.title}</span>
            </p>
            {filteredSteps[currentStep]?.description && (
              <p className="text-xs text-gray-500 mt-1">{filteredSteps[currentStep]?.description}</p>
            )}
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
};
