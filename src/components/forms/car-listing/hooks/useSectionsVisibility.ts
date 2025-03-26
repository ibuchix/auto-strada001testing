
/**
 * Changes made:
 * - 2028-06-02: Created hook to manage form sections visibility
 */

import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
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
  
  useEffect(() => {
    // Extract all section IDs from form steps
    const allSections = formSteps.flatMap(step => step.sections);
    
    // Get current form values
    const formValues = form.getValues();
    
    // Filter out sections that should be hidden based on certain conditions
    const filtered = allSections.filter(sectionId => {
      // Always show these sections
      if ([
        'vehicle-details',
        'personal-details',
        'additional-info',
        'seller-notes'
      ].includes(sectionId)) {
        return true;
      }
      
      // Only show damage section if the vehicle is damaged
      if (sectionId === 'damage-section' && !formValues.isDamaged) {
        return false;
      }
      
      // Only show finance document section if there's finance on the vehicle
      if (sectionId === 'finance-document' && !formValues.financeAmount) {
        return false;
      }
      
      // Default: show the section
      return true;
    });
    
    setVisibleSections(filtered);
  }, [form, carId]);
  
  return { visibleSections };
};
