
/**
 * Hook for managing vehicle status section
 * Updated: 2025-05-20 - Fixed TypeScript errors by updating field names to snake_case
 * Updated: 2025-05-24 - Fixed camelCase field names to be consistent with form types
 * Updated: 2025-05-25 - Resolved field naming consistency issues
 */

import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export const useVehicleStatusSection = () => {
  const { register, watch, setValue } = useFormContext<CarListingFormData>();
  const [financeSectionVisible, setFinanceSectionVisible] = useState(false);
  
  // Watch for changes to relevant fields with camelCase naming
  const hasOutstandingFinance = watch("hasOutstandingFinance");
  const hasPrivatePlate = watch("hasPrivatePlate");
  const isDamaged = watch("isDamaged");
  const hasServiceHistory = watch("hasServiceHistory");
  
  // Toggle finance section visibility based on form value
  const toggleFinanceSection = useCallback(() => {
    setFinanceSectionVisible(prev => !prev);
  }, []);
  
  // Handle checkbox changes
  const handleOutstandingFinanceChange = useCallback((checked: boolean) => {
    setValue("hasOutstandingFinance", checked, { shouldDirty: true });
    if (checked) {
      toggleFinanceSection();
    }
  }, [setValue, toggleFinanceSection]);
  
  const handlePrivatePlateChange = useCallback((checked: boolean) => {
    setValue("hasPrivatePlate", checked, { shouldDirty: true });
  }, [setValue]);
  
  const handleDamagedChange = useCallback((checked: boolean) => {
    setValue("isDamaged", checked, { shouldDirty: true });
  }, [setValue]);
  
  const handleServiceHistoryChange = useCallback((checked: boolean) => {
    setValue("hasServiceHistory", checked, { shouldDirty: true });
  }, [setValue]);
  
  return {
    register,
    hasOutstandingFinance,
    hasPrivatePlate,
    isDamaged,
    hasServiceHistory,
    financeSectionVisible,
    toggleFinanceSection,
    handleOutstandingFinanceChange,
    handlePrivatePlateChange,
    handleDamagedChange,
    handleServiceHistoryChange
  };
};
