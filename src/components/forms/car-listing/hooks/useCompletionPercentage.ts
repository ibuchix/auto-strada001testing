
/**
 * Hook to calculate form completion percentage
 * - Created to extract functionality from StepForm component
 */
import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";

interface UseCompletionPercentageProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  completedSteps: Record<number, boolean>;
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
  const calculateCompletionPercentage = useCallback(() => {
    const completedCount = Object.values(completedSteps).filter(Boolean).length;
    
    // Base completion on steps completed
    let percentage = Math.round((completedCount / totalSteps) * 100);
    
    // Adjust for current step progress
    const currentStepWeight = (1 / totalSteps) * 100;
    const currentStepProgress = currentStep > 0 ? currentStepWeight * 0.5 : 0;
    
    // Factor in form field completion
    const formValues = form.getValues();
    const defaultValues = getFormDefaults();
    let fieldsCompleted = 0;
    let totalFields = 0;
    
    // Count fields that have been filled out
    Object.entries(formValues).forEach(([key, value]) => {
      if (key === 'seller_id' || key === 'valuation_data') return; // Skip system fields
      
      totalFields++;
      
      // Get default value for comparison
      const defaultValue = defaultValues[key as keyof typeof defaultValues];
      
      // Determine if field has been modified from default
      const isModified = (() => {
        if (value === undefined || value === null || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === 'object' && value !== null) {
          // For objects like features, check if any property is true
          return Object.values(value).some(v => Boolean(v));
        } 
        return true;
      })();
      
      if (isModified) fieldsCompleted++;
    });
    
    const fieldCompletionRate = totalFields > 0 ? fieldsCompleted / totalFields : 0;
    
    // Final percentage calculation
    percentage = Math.round(percentage + currentStepProgress + (fieldCompletionRate * 10));
    
    return Math.min(percentage, 100);
  }, [form, currentStep, completedSteps, totalSteps]);
  
  return calculateCompletionPercentage();
};
