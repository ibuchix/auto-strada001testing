
/**
 * Changes made:
 * - 2024-08-08: Updated FormProgress to show multi-step indicators
 * - 2027-07-25: Updated props to match expected usage in FormContent.tsx
 */

import { Progress } from "@/components/ui/progress";
import { Check, Clock } from "lucide-react";

interface FormProgressProps {
  progress: number;
  steps?: Array<{
    id: string;
    title: string;
    sections: string[];
  }>;
  currentStep?: number;
  onStepClick?: (step: number) => void;
}

export const FormProgress = ({ 
  progress, 
  steps = [], 
  currentStep = 0,
  onStepClick
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
      />
      
      <div className="hidden md:flex justify-between items-center">
        {steps.map((step, index) => (
          <div 
            key={step.id} 
            className={`flex flex-col items-center cursor-pointer group`}
            onClick={() => onStepClick && onStepClick(index)}
          >
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                ${index < currentStep 
                  ? 'bg-[#21CA6F] text-white' 
                  : index === currentStep
                    ? 'bg-[#DC143C] text-white' 
                    : 'bg-gray-200 text-gray-500'
                }
                transition-all duration-200 group-hover:scale-110`}
            >
              {index < currentStep ? (
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
          </div>
        ))}
      </div>
      
      {/* Mobile view */}
      <div className="md:hidden flex items-center justify-center mb-2">
        <span className="text-sm font-semibold">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
        </span>
      </div>
    </div>
  );
};
