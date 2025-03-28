
/**
 * MobileStepper Component
 * Renders a compact stepper view for mobile screens
 */

import { cn } from '@/lib/utils';

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
          Step {currentStep + 1} of {steps.length}: <span className="text-[#DC143C]">{steps[currentStep]?.title}</span>
        </p>
        {steps[currentStep]?.description && (
          <p className="text-xs text-gray-500 mt-1">{steps[currentStep]?.description}</p>
        )}
      </div>
    </div>
  );
};
