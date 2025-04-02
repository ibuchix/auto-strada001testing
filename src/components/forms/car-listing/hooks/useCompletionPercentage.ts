
/**
 * Changes made:
 * - 2028-11-15: Extracted completion percentage calculation from StepForm.tsx
 */

import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { STEP_FIELD_MAPPINGS } from "./useStepValidation";

interface UseCompletionPercentageProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  completedSteps: Record<string, boolean>;
  totalSteps: number;
  filteredSteps: any[];
}

export const useCompletionPercentage = ({
  form,
  currentStep,
  completedSteps,
  totalSteps,
  filteredSteps
}: UseCompletionPercentageProps) => {
  const completionPercentage = useMemo(() => {
    const defaultValues = getFormDefaults();
    const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
    const basicProgress = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;
    
    const formValues = form.getValues();
    let totalFields = 0;
    let completedFields = 0;
    
    for (let i = 0; i <= currentStep; i++) {
      if (i >= filteredSteps.length) continue;
      
      const fieldsInStep = STEP_FIELD_MAPPINGS[filteredSteps[i].id] || [];
      
      fieldsInStep.forEach(field => {
        const fieldValue = formValues[field as keyof CarListingFormData];
        const defaultValue = defaultValues[field as keyof typeof defaultValues];
        
        totalFields++;
        
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          if (Array.isArray(fieldValue)) {
            if (fieldValue.length > 0) completedFields++;
          } 
          else if (typeof fieldValue === 'object') {
            if (typeof defaultValue === 'object' && defaultValue !== null) {
              const hasModifiedProps = Object.entries(fieldValue).some(([key, val]) => {
                const defVal = defaultValue[key as keyof typeof defaultValue];
                return val !== defVal && val !== false;
              });
              if (hasModifiedProps) completedFields++;
            } else if (Object.values(fieldValue).some(v => Boolean(v))) {
              completedFields++;
            }
          } 
          else if (fieldValue !== defaultValue) {
            if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
            } else {
              completedFields++;
            }
          }
        }
      });
    }
    
    const fieldProgress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    const stepRatio = Math.min(currentStep / (totalSteps - 1), 1);
    const combinedProgress = Math.round(fieldProgress * (1 - stepRatio * 0.5) + basicProgress * (stepRatio * 0.5));
    
    return Math.max(combinedProgress, currentStep > 0 ? 10 : 5);
  }, [form, filteredSteps, currentStep, completedSteps, totalSteps]);

  return completionPercentage;
};
