
/**
 * Changes made:
 * - 2024-06-07: Created FormStepIndicator to show form progress steps
 */

import { formSteps } from "./constants/formSteps";
import { cn } from "@/lib/utils";

interface FormStepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  visibleSections: string[];
}

export const FormStepIndicator = ({ 
  currentStep, 
  onStepClick,
  visibleSections
}: FormStepIndicatorProps) => {
  return (
    <div className="flex flex-wrap gap-2 my-4">
      {formSteps.map((step, index) => {
        // Check if any sections in this step are visible
        const hasVisibleSection = step.sections.some(
          sectionId => visibleSections.includes(sectionId)
        );
        
        // Skip steps with no visible sections
        if (!hasVisibleSection) return null;
        
        const isActive = index === currentStep;
        const isPast = index < currentStep;
        
        return (
          <button
            key={step.id}
            onClick={() => onStepClick(index)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              isActive 
                ? "bg-[#DC143C] text-white" 
                : isPast 
                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            <span className="mr-2">
              {isPast ? "✓" : `${index + 1}.`}
            </span>
            {step.title}
          </button>
        );
      })}
    </div>
  );
};
