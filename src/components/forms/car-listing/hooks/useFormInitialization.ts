
/**
 * Hook for initializing form data
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 */

import { useEffect, useCallback, useState } from "react";
import { useFormData } from "../context/FormDataContext";
import { toast } from "sonner";

interface UseFormInitializationProps {
  fromValuation?: boolean;
  draftId?: string;
}

export const useFormInitialization = ({
  fromValuation = false,
  draftId
}: UseFormInitializationProps = {}) => {
  const { form, isLoading } = useFormData();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize the form with default values and/or load draft data
  const initializeForm = useCallback(async () => {
    try {
      if (fromValuation) {
        const valuationDataStr = localStorage.getItem('valuationData');
        
        if (valuationDataStr) {
          const valuationData = JSON.parse(valuationDataStr);
          
          form.setValue('from_valuation', true);
          form.setValue('valuation_data', valuationData);
          
          if (valuationData.make) form.setValue('make', valuationData.make);
          if (valuationData.model) form.setValue('model', valuationData.model);
          if (valuationData.year) form.setValue('year', Number(valuationData.year));
          if (valuationData.mileage) form.setValue('mileage', Number(valuationData.mileage));
          if (valuationData.vin) form.setValue('vin', valuationData.vin);
          
          // Set price from valuation
          if (valuationData.valuation) {
            form.setValue('price', Number(valuationData.valuation));
          }
          
          // Set reserve price from valuation
          if (valuationData.reservePrice) {
            form.setValue('reserve_price', Number(valuationData.reservePrice));
          }
          
          toast.success("Valuation data loaded successfully");
        } else {
          console.warn("No valuation data found despite fromValuation flag");
        }
      }
      
      // If we have a draft ID, load the draft data
      if (draftId) {
        // In a real app, you'd load draft data here
        console.log("Loading draft data for ID:", draftId);
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing form:", error);
      toast.error("Error initializing form");
    }
  }, [form, fromValuation, draftId]);
  
  // Run initialization on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initializeForm();
    }
  }, [isInitialized, isLoading, initializeForm]);
  
  return {
    isInitialized,
    initializeForm
  };
};
