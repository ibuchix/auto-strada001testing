
/**
 * MobileStepper Component
 * Renders a compact stepper view for mobile screens
 * Enhanced to show completion status more clearly
 */

import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface MobileStepperProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  currentStep: number;
  completedSteps: number[];
  stepErrors: Record<string, boolean>;
}

export const MobileStepper = ({ 
  steps, 
  currentStep, 
  completedSteps, 
  stepErrors 
}: MobileStepperProps) => {
  return (
    <div className="md:hidden">
      <div className="flex items-center space-x-2 mb-4 justify-center">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.includes(index);
          const hasError = stepErrors[step.id];
          
          return (
            <div 
              key={index}
              className="relative"
            >
              <div 
                className={cn(
                  "h-2 rounded-full transition-all",
                  hasError ? "bg-red-500" : "",
                  isActive 
                    ? "w-8 bg-[#DC143C]" 
                    : isCompleted 
                      ? "w-4 bg-[#21CA6F]" 
                      : "w-4 bg-gray-200"
                )}
                aria-hidden="true"
              />
              
              {(isCompleted || hasError) && (
                <span className="absolute -top-2 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white">
                  {hasError ? (
                    <AlertCircle className="w-3 h-3 text-red-500" />
                  ) : (
                    <Check className="w-3 h-3 text-[#21CA6F]" />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium flex items-center justify-center">
          Step {currentStep + 1} of {steps.length}: 
          <span className="text-[#DC143C] ml-1">{steps[currentStep]?.title}</span>
          
          {stepErrors[steps[currentStep]?.id] ? (
            <AlertCircle className="ml-1 w-4 h-4 text-red-500" />
          ) : completedSteps.includes(currentStep) ? (
            <Check className="ml-1 w-4 h-4 text-[#21CA6F]" />
          ) : null}
        </p>
        {steps[currentStep]?.description && (
          <p className="text-xs text-gray-500 mt-1">{steps[currentStep]?.description}</p>
        )}
      </div>
      
      {/* Completion status indicator */}
      <div className="mt-2 text-xs text-center">
        <span className={cn(
          "px-2 py-0.5 rounded-full",
          completedSteps.includes(currentStep) 
            ? "bg-green-100 text-green-800" 
            : stepErrors[steps[currentStep]?.id]
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
        )}>
          {completedSteps.includes(currentStep) 
            ? "Completed" 
            : stepErrors[steps[currentStep]?.id]
              ? "Needs attention"
              : "In progress"}
        </span>
      </div>
    </div>
  );
};
