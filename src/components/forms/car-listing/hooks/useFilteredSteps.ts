
/**
 * Changes made:
 * - 2028-11-12: Extracted filtered steps logic from FormContent.tsx
 */

import { useMemo, useEffect } from "react";
import { formSteps } from "../constants/formSteps";

interface StepConfig {
  id: string;
  validate?: () => boolean;
}

interface UseFilteredStepsProps {
  visibleSections: string[];
  setFormState: (updater: (prev: any) => any) => void;
}

export const useFilteredSteps = ({ visibleSections, setFormState }: UseFilteredStepsProps) => {
  // Default step configuration for fallback
  const defaultSteps = useMemo(() => [{
    id: 'default',
    validate: () => true
  }], []);

  // Calculate filtered steps based on visible sections - memoized
  const filteredSteps = useMemo(() => {
    // Ensure we always return at least one step to prevent conditional hook calls
    const filtered = formSteps.filter(step => {
      return step.sections.some(section => visibleSections.includes(section));
    });
    
    return filtered.length > 0 ? filtered : defaultSteps;
  }, [visibleSections, defaultSteps]);

  // Update filtered steps in state whenever they change
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      filteredStepsArray: filteredSteps,
      totalSteps: Math.max(filteredSteps.length, 1)
    }));
  }, [filteredSteps, setFormState]);

  // Create properly typed step config array for useStepNavigation
  const typedStepConfigs = useMemo(() => {
    return filteredSteps.map(step => {
      return {
        id: step.id,
        validate: step.validate 
          ? () => (step.validate ? step.validate(undefined) : true)
          : undefined
      } as StepConfig;
    });
  }, [filteredSteps]);

  return {
    filteredSteps,
    typedStepConfigs
  };
};
