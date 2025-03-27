
/**
 * Changes made:
 * - Enhanced accessibility for step navigation
 * - Improved mobile styling for better readability
 * - Added proper aria attributes for screen readers
 * - Fixed step access issues for certain steps
 * - Improved visual feedback for current and completed steps
 */

import { useCallback } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
  sections?: string[]; // Added sections property to fix TypeScript errors
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
  // Modified isStepAccessible function to handle "notes" or "seller-notes" sections
  const isStepAccessible = useCallback((step: Step, index: number) => {
    // Always make specific steps accessible regardless of visibility
    if (step.id === 'notes' || step.title === 'Seller Notes') {
      return true;
    }
    
    // For steps with multiple sections, check if any of their sections are visible
    if (Array.isArray(step.sections)) {
      return step.sections.some(sectionId => visibleSections.includes(sectionId));
    }
    
    // Default case: check if the step ID is in visible sections
    return visibleSections.includes(step.id);
  }, [visibleSections]);

  // Handlers for accessibility
  const handleStepClick = (index: number, isAccessible: boolean) => {
    if (isAccessible) {
      console.log(`Clicking on step ${index}`);
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
    <nav aria-label="Form Progress" className="py-6">
      <ol role="list" className="hidden md:flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isAccessible = isStepAccessible(step, index);
          
          return (
            <li key={step.id} className={cn(
              "relative",
              "flex-shrink-0 flex flex-col items-center",
              "w-[120px]"
            )}>
              {/* Connection line between steps */}
              {index !== steps.length - 1 && (
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
                  <button
                    type="button"
                    onClick={() => handleStepClick(index, isAccessible)}
                    onKeyDown={(e) => handleStepKeyDown(e, index, isAccessible)}
                    disabled={!isAccessible}
                    aria-current={isActive ? "step" : undefined}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#DC143C]/40 focus:ring-offset-2",
                      isCompleted 
                        ? "bg-[#DC143C] hover:bg-[#DC143C]/90" 
                        : isActive 
                          ? "bg-[#DC143C] text-white"
                          : isAccessible 
                            ? "bg-white border-2 border-[#DC143C] hover:border-[#DC143C]/80"
                            : "bg-white border-2 border-gray-300 cursor-not-allowed"
                    )}
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
                  </button>
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
          {steps.map((step, index) => (
            <div 
              key={index}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentStep 
                  ? "w-8 bg-[#DC143C]" 
                  : index < currentStep 
                    ? "w-4 bg-[#DC143C]/60" 
                    : "w-4 bg-gray-200"
              )}
              aria-hidden="true"
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
