
/**
 * Changes made:
 * - 2028-06-02: Created hook to manage form sections visibility
 * - 2028-06-10: Enhanced with dynamic section visibility based on form state
 * - 2025-04-03: Updated to support consolidated 3-step form structure
 */

import { useEffect, useState } from "react";
import { UseFormReturn, useWatch } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "../constants/formSteps";

/**
 * Hook to determine which sections of the car listing form should be visible
 * based on form state and car existence
 */
export const useSectionsVisibility = (
  form: UseFormReturn<CarListingFormData>,
  carId?: string
) => {
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  
  // Watch relevant form fields that affect section visibility
  const isDamaged = useWatch({
    control: form.control,
    name: "isDamaged",
    defaultValue: false
  });
  
  const hasOutstandingFinance = useWatch({
    control: form.control,
    name: "hasOutstandingFinance",
    defaultValue: false
  });
  
  const hasWarningLights = useWatch({
    control: form.control,
    name: "hasWarningLights",
    defaultValue: false
  });
  
  const isRegisteredInPoland = useWatch({
    control: form.control,
    name: "isRegisteredInPoland",
    defaultValue: true
  });
  
  useEffect(() => {
    // Extract all section IDs from form steps
    const allSections = formSteps.flatMap(step => step.sections);
    
    // All base sections are always visible in the 3-step structure
    const baseSections = [
      'vehicle-details',
      'personal-details',
      'photos',
      'vehicle-status',
      'features',
      'service-history',
      'additional-info',
      'seller-notes'
    ];
    
    // Conditionally visible sections
    const conditionalSections = [];
    
    // Only show damage section if the vehicle is damaged
    if (isDamaged) {
      conditionalSections.push('damage');
    }
    
    // Only show warning lights section if there are warning lights
    if (hasWarningLights) {
      conditionalSections.push('warning-lights');
    }
    
    // Only show finance details if there's finance on the vehicle
    if (hasOutstandingFinance) {
      conditionalSections.push('finance-details');
    }
    
    // Only require rim photos if registered in Poland
    if (isRegisteredInPoland) {
      conditionalSections.push('rims');
    }
    
    // Combine all visible sections
    setVisibleSections([...baseSections, ...conditionalSections]);
  }, [isDamaged, hasOutstandingFinance, hasWarningLights, isRegisteredInPoland, carId]);
  
  // Compute the total number of steps (always 3 in this consolidated structure)
  const activeSteps = formSteps.filter(step => {
    return step.sections.some(section => visibleSections.includes(section));
  });
  
  return { 
    visibleSections,
    totalRequiredSteps: activeSteps.length
  };
};
