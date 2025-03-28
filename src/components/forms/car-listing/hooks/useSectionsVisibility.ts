
/**
 * Changes made:
 * - 2028-06-02: Created hook to manage form sections visibility
 * - 2028-06-10: Enhanced with dynamic section visibility based on form state
 * - Added support for conditional section rendering
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
    
    // Filter out sections that should be hidden based on certain conditions
    const filtered = allSections.filter(sectionId => {
      // Always show these base sections
      if ([
        'vehicle-details',
        'personal-details',
        'additional-info',
        'seller-notes',
        'photos',
        'features',
        'vehicle-status',
        'service-history'
      ].includes(sectionId)) {
        return true;
      }
      
      // Only show damage section if the vehicle is damaged
      if (sectionId === 'damage' && !isDamaged) {
        return false;
      }
      
      // Only show warning lights section if there are warning lights
      if (sectionId === 'warning-lights' && !hasWarningLights) {
        return false;
      }
      
      // Only show finance details if there's finance on the vehicle
      if (sectionId === 'finance-details' && !hasOutstandingFinance) {
        return false;
      }
      
      // Only require rim photos if registered in Poland
      if (sectionId === 'rims' && !isRegisteredInPoland) {
        return false;
      }
      
      // Default: show the section
      return true;
    });
    
    setVisibleSections(filtered);
  }, [isDamaged, hasOutstandingFinance, hasWarningLights, isRegisteredInPoland, carId]);
  
  // Also compute the total number of steps required based on visible sections
  const activeSteps = formSteps.filter(step => {
    return step.sections.some(section => visibleSections.includes(section));
  });
  
  return { 
    visibleSections,
    totalRequiredSteps: activeSteps.length
  };
};
