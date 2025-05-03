
/**
 * useVehicleStatusSection Hook
 * Created: 2025-06-20 - Fixed type conversion and property name issues
 */

import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export const useVehicleStatusSection = (form: UseFormReturn<CarListingFormData>) => {
  const [hasFinance, setHasFinance] = useState(form.watch("hasOutstandingFinance") || false);
  const [hasPrivatePlate, setHasPrivatePlate] = useState(form.watch("hasPrivatePlate") || false);
  
  // Watch for changes to finance fields
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "hasOutstandingFinance") {
        setHasFinance(!!value.hasOutstandingFinance);
        
        // Reset finance fields if "no" is selected
        if (!value.hasOutstandingFinance) {
          form.setValue("financeAmount", 0, { shouldValidate: true });
          form.setValue("financeProvider", "", { shouldValidate: true });
          form.setValue("financeEndDate", "", { shouldValidate: true });
        }
      }
      
      if (name === "hasPrivatePlate") {
        setHasPrivatePlate(!!value.hasPrivatePlate);
        
        // Reset private plate field if "no" is selected
        if (!value.hasPrivatePlate) {
          form.setValue("privateReg", "", { shouldValidate: true });
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Handle finance amount change with proper type conversion
  const handleFinanceAmountChange = (value: string) => {
    // Convert string to number safely
    const numericValue = parseFloat(value) || 0;
    form.setValue("financeAmount", numericValue, { shouldValidate: true });
  };
  
  // Handle private plate change - using privateReg instead of privatePlateDetails
  const handlePrivatePlateChange = (value: string) => {
    form.setValue("privateReg", value, { shouldValidate: true });
  };
  
  return {
    hasFinance,
    hasPrivatePlate,
    handleFinanceAmountChange,
    handlePrivatePlateChange
  };
};
