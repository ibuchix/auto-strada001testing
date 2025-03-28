
/**
 * Changes made:
 * - 2024-08-08: Updated FormProgress to show multi-step indicators
 * - 2027-07-25: Updated props to match expected usage in FormContent.tsx
 * - 2027-08-01: Updated type definition to make description optional and handle component property
 * - 2027-08-02: Added completion status indicators and improved progress visualization
 * - 2028-06-15: Added micro-interactions for progress steps and transitions
 */

import { Progress } from "@/components/ui/progress";
import { Check, Clock, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

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
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  // Animate progress bar
  useEffect(() => {
    // Animate progress smoothly
    const animationInterval = setInterval(() => {
      setAnimatedProgress(prev => {
        if (Math.abs(prev - progress) < 1) {
          clearInterval(animationInterval);
          return progress;
        }
        return prev < progress ? prev + 1 : prev - 1;
      });
    }, 20);
    
    return () => clearInterval(animationInterval);
  }, [progress]);

  if (!steps.length) {
    return (
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm text-subtitle">
          <span>Form Progress</span>
          <span>{Math.round(animatedProgress)}%</span>
        </div>
        <Progress 
          value={animatedProgress} 
          className="h-2 bg-accent"
          indicatorClassName={animatedProgress === 100 ? "bg-[#21CA6F] transition-all duration-500" : "bg-[#DC143C] transition-all duration-500"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-subtitle">
        <span>Form Progress</span>
        <span className="font-medium transition-all duration-300">{Math.round(animatedProgress)}%</span>
      </div>
      <Progress 
        value={animatedProgress} 
        className="h-2 bg-accent mb-4"
        indicatorClassName={cn(
          "transition-all duration-500",
          animatedProgress === 100 ? "bg-[#21CA6F]" : "bg-[#DC143C]"
        )}
      />
      
      <div className="hidden md:flex justify-between items-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const hasError = errorSteps[step.id];
          const isActive = index === currentStep;
          
          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center cursor-pointer group transition-all duration-300`}
              onClick={() => onStepClick && onStepClick(index)}
            >
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 relative transition-all duration-300",
                  isCompleted 
                    ? 'bg-[#21CA6F] text-white transform hover:scale-110' 
                    : isActive
                      ? 'bg-[#DC143C] text-white transform hover:scale-110' 
                      : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                )}
              >
                {hasError && (
                  <CircleAlert className="absolute -top-1 -right-1 w-4 h-4 text-red-500 bg-white rounded-full animate-pulse" />
                )}
                
                {isCompleted ? (
                  <Check className={cn("h-5 w-5", isActive ? "animate-scale-in" : "")} />
                ) : (
                  <span className={cn(isActive ? "animate-scale-in" : "")}>{index + 1}</span>
                )}
              </div>
              <span 
                className={cn(
                  "text-xs text-center transition-all duration-300",
                  isActive ? 'font-bold text-[#DC143C]' : 'text-gray-500 group-hover:text-gray-800'
                )}
              >
                {step.title}
              </span>
              
              {/* Step status indicator */}
              <div className="mt-1 flex items-center">
                {hasError ? (
                  <span className="text-xs text-red-500 flex items-center animate-pulse">
                    <CircleAlert className="w-3 h-3 mr-1" />
                    Fix errors
                  </span>
                ) : isCompleted ? (
                  <span className="text-xs text-[#21CA6F] flex items-center">
                    <Check className="w-3 h-3 mr-1" />
                    Complete
                  </span>
                ) : isActive ? (
                  <span className="text-xs text-[#DC143C] flex items-center">
                    <Clock className="w-3 h-3 mr-1 animate-pulse" />
                    In progress
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Pending
                  </span>
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
          <span className="ml-1 text-[#DC143C] transition-all duration-300">{steps[currentStep]?.title}</span>
          {completedSteps.includes(currentStep) && (
            <Check className="ml-1 w-4 h-4 text-[#21CA6F] animate-scale-in" />
          )}
        </span>
      </div>
    </div>
  );
};
