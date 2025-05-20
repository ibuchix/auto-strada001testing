
/**
 * Hook for determining which form sections should be visible
 * Created: 2025-05-12
 * Updated: 2025-05-13 - Added visibility logic for damage and finance sections
 * Updated: 2025-05-14 - Fixed issue with condition evaluation for finance section
 * Updated: 2025-05-24 - Updated to use camelCase field names consistently
 * Updated: 2025-05-28 - Fixed null safety checks for sectionName
 */

import { useFormContext } from "react-hook-form";
import { useCallback, useMemo } from "react";
import { CarListingFormData } from "@/types/forms";

export const useSectionsVisibility = () => {
  const form = useFormContext<CarListingFormData>();
  
  // Get current values from form
  const isDamaged = form.watch("isDamaged");
  const hasOutstandingFinance = form.watch("hasOutstandingFinance");
  const hasServiceHistory = form.watch("hasServiceHistory");
  const hasPrivatePlate = form.watch("hasPrivatePlate");
  const hasWarningLights = form.watch("hasWarningLights");
  
  // Define visibility conditions for each section
  const conditions = useMemo(() => ({
    // Always visible sections
    BasicInfo: true,
    Features: true,
    Photos: true,
    SellerNotes: true,
    PersonalDetails: true,
    
    // Conditionally visible sections
    DamageDetails: !!isDamaged,
    FinanceDetails: !!hasOutstandingFinance,
    ServiceHistory: !!hasServiceHistory,
    PrivatePlate: !!hasPrivatePlate,
    WarningLights: !!hasWarningLights,
  }), [
    isDamaged,
    hasOutstandingFinance,
    hasServiceHistory,
    hasPrivatePlate,
    hasWarningLights
  ]);
  
  /**
   * Check if a section should be visible
   */
  const isSectionVisible = useCallback((sectionName: string | null): boolean => {
    if (sectionName === null) return false;
    
    // If there's an explicit condition, use it
    if (sectionName in conditions) {
      return conditions[sectionName as keyof typeof conditions];
    }
    
    // Default to visible if no condition is specified
    return true;
  }, [conditions]);
  
  /**
   * Filter an array of section names to only those that should be visible
   */
  const getVisibleSections = useCallback((sections: string[]): string[] => {
    return sections.filter(isSectionVisible);
  }, [isSectionVisible]);

  return {
    isSectionVisible,
    getVisibleSections,
    conditions
  };
};
