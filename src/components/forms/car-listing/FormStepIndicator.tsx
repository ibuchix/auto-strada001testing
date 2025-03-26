
/**
 * Changes made:
 * - 2023-07-15: Created FormStepIndicator component for multi-step form navigation
 */

import { formSteps } from "./constants/formSteps";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FormStepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  visibleSections?: string[];
}

export const FormStepIndicator = ({ 
  currentStep, 
  onStepClick,
  visibleSections = [] 
}: FormStepIndicatorProps) => {
  // Filter steps based on visibleSections
  const filteredSteps = formSteps.filter(step => 
    visibleSections.includes(step.id)
  );
  
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center w-full overflow-x-auto py-2 px-2 space-x-2 sm:space-x-4">
        {filteredSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <li key={step.id} className="flex items-center relative">
              <Button
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`
                  flex items-center justify-center
                  ${isActive ? 'bg-[#DC143C] text-white' : ''}
                  ${isCompleted ? 'bg-green-100 text-green-800 border-green-300' : ''}
                  rounded-full h-8 w-8 p-0
                `}
                onClick={() => onStepClick(index)}
                disabled={!isCompleted && !isActive}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </Button>
              
              <span className="ml-2 whitespace-nowrap text-sm font-medium">
                {step.title}
              </span>
              
              {index < filteredSteps.length - 1 && (
                <ChevronRight className="ml-2 h-4 w-4 text-gray-400" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
