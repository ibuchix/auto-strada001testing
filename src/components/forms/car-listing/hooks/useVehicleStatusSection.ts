
/**
 * Hook for managing vehicle status section
 * Updated: 2025-05-20 - Fixed TypeScript errors by updating field names to snake_case
 */

import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export const useVehicleStatusSection = () => {
  const { register, watch, setValue } = useFormContext<CarListingFormData>();
  const [financeSectionVisible, setFinanceSectionVisible] = useState(false);
  
  // Watch for changes to relevant fields with snake_case naming
  const has_outstanding_finance = watch("has_outstanding_finance");
  const has_private_plate = watch("has_private_plate");
  const is_damaged = watch("is_damaged");
  const has_service_history = watch("has_service_history");
  
  // Toggle finance section visibility based on form value
  const toggleFinanceSection = useCallback(() => {
    setFinanceSectionVisible(prev => !prev);
  }, []);
  
  // Handle checkbox changes
  const handleOutstandingFinanceChange = useCallback((checked: boolean) => {
    setValue("has_outstanding_finance", checked, { shouldDirty: true });
    if (checked) {
      toggleFinanceSection();
    }
  }, [setValue, toggleFinanceSection]);
  
  const handlePrivatePlateChange = useCallback((checked: boolean) => {
    setValue("has_private_plate", checked, { shouldDirty: true });
  }, [setValue]);
  
  const handleDamagedChange = useCallback((checked: boolean) => {
    setValue("is_damaged", checked, { shouldDirty: true });
  }, [setValue]);
  
  const handleServiceHistoryChange = useCallback((checked: boolean) => {
    setValue("has_service_history", checked, { shouldDirty: true });
  }, [setValue]);
  
  return {
    register,
    has_outstanding_finance,
    has_private_plate,
    is_damaged,
    has_service_history,
    financeSectionVisible,
    toggleFinanceSection,
    handleOutstandingFinanceChange,
    handlePrivatePlateChange,
    handleDamagedChange,
    handleServiceHistoryChange
  };
};
