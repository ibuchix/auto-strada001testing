
/**
 * Changes made:
 * - 2024-08-08: Updated FormProgress to show multi-step indicators
 * - 2027-07-25: Updated props to match expected usage in FormContent.tsx
 * - 2027-08-01: Updated type definition to make description optional and handle component property
 * - 2027-08-02: Added completion status indicators and improved progress visualization
 */

import { Progress } from "@/components/ui/progress";
import { Check, Clock, CircleAlert } from "lucide-react";

// Update the interface to reflect the actual structure of steps
interface FormStep {
  id: string;
  title: string;
  sections: string[];
  component?: React.ComponentType<any>;
  description?: string;
}

interface FormProgressProps {
  progress: number;
  steps?: FormStep[];
  currentStep?: number;
  onStepClick?: (step: number) => void;
  completedSteps?: number[];
  errorSteps?: Record<string, boolean>;
}

export const FormProgress = ({ 
  progress, 
  steps = [], 
  currentStep = 0,
  onStepClick,
  completedSteps = [],
  errorSteps = {}
}: FormProgressProps) => {
  if (!steps.length) {
    return (
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm text-subtitle">
          <span>Form Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2 bg-accent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-subtitle">
        <span>Form Progress</span>
        <span>{progress}%</span>
      </div>
      <Progress 
        value={progress} 
        className="h-2 bg-accent mb-4"
        indicatorClassName={progress === 100 ? "bg-[#21CA6F]" : "bg-[#DC143C]"}
      />
      
      <div className="hidden md:flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const hasError = errorSteps[step.id];
          
          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center cursor-pointer group`}
              onClick={() => onStepClick && onStepClick(index)}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 relative
                  ${isCompleted 
                    ? 'bg-[#21CA6F] text-white' 
                    : index === currentStep
                      ? 'bg-[#DC143C] text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }
                  transition-all duration-200 group-hover:scale-110`}
              >
                {hasError && (
                  <CircleAlert className="absolute -top-1 -right-1 w-4 h-4 text-red-500 bg-white rounded-full" />
                )}
                
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span 
                className={`text-xs text-center
                  ${index === currentStep ? 'font-bold text-[#DC143C]' : 'text-gray-500'}`}
              >
                {step.title}
              </span>
              
              {/* Step status indicator */}
              <div className="mt-1 flex items-center">
                {hasError ? (
                  <span className="text-xs text-red-500 flex items-center">
                    <CircleAlert className="w-3 h-3 mr-1" />
                    Fix errors
                  </span>
                ) : isCompleted ? (
                  <span className="text-xs text-[#21CA6F] flex items-center">
                    <Check className="w-3 h-3 mr-1" />
                    Complete
                  </span>
                ) : index === currentStep ? (
                  <span className="text-xs text-[#DC143C] flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    In progress
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden flex items-center justify-center mb-2">
        <span className="text-sm font-semibold flex items-center">
          Step {currentStep + 1} of {steps.length}: 
          <span className="ml-1 text-[#DC143C]">{steps[currentStep]?.title}</span>
          {completedSteps.includes(currentStep) && (
            <Check className="ml-1 w-4 h-4 text-[#21CA6F]" />
          )}
        </span>
      </div>
    </div>
  );
};
