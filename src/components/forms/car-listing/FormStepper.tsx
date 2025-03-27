
/**
 * FormStepper Component
 * 
 * A navigation component that displays the current step in a multi-step form process
 * and allows users to navigate between steps.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Circle } from "lucide-react";

interface FormStepperProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  currentStep: number;
  onStepChange: (step: number) => void;
  visibleSections: string[];
}

export const FormStepper = ({
  steps,
  currentStep,
  onStepChange,
  visibleSections
}: FormStepperProps) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check viewport size on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Filter steps based on visibility if needed
  const visibleSteps = steps.filter(step => 
    visibleSections.includes(step.id) || visibleSections.length === 0
  );

  return (
    <div className="w-full">
      <div className="hidden md:flex items-center justify-between">
        {visibleSteps.map((step, index) => (
          <div 
            key={step.id} 
            className="flex flex-col items-center relative"
          >
            {/* Step button */}
            <Button
              type="button"
              onClick={() => onStepChange(index)}
              variant={currentStep === index ? "default" : "outline"}
              className={`rounded-full w-10 h-10 p-0 ${
                currentStep === index 
                  ? "bg-[#DC143C] text-white" 
                  : index < currentStep 
                    ? "bg-green-100 text-green-700 border-green-300" 
                    : ""
              }`}
            >
              {index < currentStep ? (
                <Check className="h-5 w-5" />
              ) : (
                <span>{index + 1}</span>
              )}
            </Button>
            
            {/* Step title */}
            <div className="mt-2 text-sm font-medium text-center">
              {step.title}
            </div>
            
            {/* Connector line */}
            {index < visibleSteps.length - 1 && (
              <div 
                className={`absolute top-5 left-[3.25rem] h-[2px] w-[calc(100vw/var(--total-steps))] ${
                  index < currentStep ? "bg-[#DC143C]" : "bg-gray-200"
                }`}
                style={{ 
                  width: `calc(100vw/${visibleSteps.length * 2})`, 
                  "--total-steps": visibleSteps.length 
                } as React.CSSProperties}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Mobile view - just show current step title and navigation */}
      <div className="flex flex-col md:hidden">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {visibleSteps.length}
          </span>
          <h3 className="text-lg font-medium">
            {visibleSteps[currentStep]?.title || ""}
          </h3>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 h-1 rounded-full">
          <div 
            className="bg-[#DC143C] h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / visibleSteps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
