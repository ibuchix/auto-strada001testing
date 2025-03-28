
/**
 * Changes made:
 * - Created custom hook for Vehicle Status section
 * - Encapsulated status field dependencies and visibility logic
 * - Implemented conditional field validation
 */

import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export const useVehicleStatusSection = (form: UseFormReturn<CarListingFormData>) => {
  const isDamaged = form.watch("isDamaged");
  const hasOutstandingFinance = form.watch("hasOutstandingFinance");
  const hasPrivatePlate = form.watch("hasPrivatePlate");
  const hasWarningLights = form.watch("hasWarningLights");
  
  // Reset related fields when parent fields change
  useEffect(() => {
    if (!isDamaged) {
      // Reset damage reports when isDamaged is set to false
      form.setValue("damageReports", [], { shouldValidate: true });
    }
  }, [isDamaged, form]);
  
  useEffect(() => {
    if (!hasOutstandingFinance) {
      // Reset finance fields when hasOutstandingFinance is set to false
      form.setValue("financeAmount", "", { shouldValidate: true });
      form.setValue("financeProvider", undefined, { shouldValidate: true });
      form.setValue("financeEndDate", undefined, { shouldValidate: true });
      form.setValue("financeDocument", null, { shouldValidate: true });
    }
  }, [hasOutstandingFinance, form]);
  
  useEffect(() => {
    if (!hasPrivatePlate) {
      // Reset private plate info when hasPrivatePlate is set to false
      form.setValue("privatePlateDetails", "", { shouldValidate: true });
    }
  }, [hasPrivatePlate, form]);
  
  // Get visibility state for conditional sections
  const getSectionVisibility = () => {
    return {
      showDamageSection: isDamaged,
      showFinanceSection: hasOutstandingFinance,
      showWarningLightsSection: hasWarningLights
    };
  };
  
  // Validate vehicle status section
  const validateVehicleStatusSection = () => {
    // All fields are checkboxes with default values, so basic validation
    // is not needed. Instead, check for any conditional logic.
    
    // If vehicle is damaged, ensure the damages are documented in the next section
    if (isDamaged) {
      const damageReports = form.getValues().damageReports || [];
      if (damageReports.length === 0) {
        return false; // Don't allow proceeding without damage reports
      }
    }
    
    // If there's outstanding finance, ensure it's documented in the next section
    if (hasOutstandingFinance) {
      const financeAmount = form.getValues().financeAmount;
      if (!financeAmount) {
        return false; // Don't allow proceeding without finance details
      }
    }
    
    return true;
  };
  
  return {
    isDamaged,
    hasOutstandingFinance,
    hasPrivatePlate,
    hasWarningLights,
    getSectionVisibility,
    validateVehicleStatusSection
  };
};
