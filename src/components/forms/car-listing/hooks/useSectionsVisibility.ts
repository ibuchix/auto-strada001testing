
/**
 * Changes made:
 * - 2028-07-14: Created useSectionsVisibility hook for dynamic form section visibility
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useEffect, useState } from "react";
import { formSteps } from "../constants/formSteps";

export const useSectionsVisibility = (
  form: UseFormReturn<CarListingFormData>,
  carId?: string
) => {
  const [visibleSections, setVisibleSections] = useState<string[]>(
    formSteps.map(step => step.id)
  );

  // Watch values that determine visibility
  const isDamaged = form.watch("isDamaged");
  const hasFinanceAmount = !!form.watch("financeAmount");

  useEffect(() => {
    // Base sections that are always visible
    const sections = formSteps.map(step => step.id);
    
    // Apply conditional logic to filter sections
    const filteredSections = sections.filter(sectionId => {
      // Show damage section only if car is damaged
      if (sectionId === 'damage' && !isDamaged) {
        return false;
      }
      
      // Show finance document section only if there's finance amount
      if (sectionId === 'financeDocument' && !hasFinanceAmount) {
        return false;
      }
      
      return true;
    });
    
    setVisibleSections(filteredSections);
  }, [isDamaged, hasFinanceAmount, carId]);

  return { visibleSections };
};
