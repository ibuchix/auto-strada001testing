
/**
 * Hook for providing form defaults
 * Updated: 2025-05-30 - Enhanced valuation data loading to fix reserve price issue
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { useState, useEffect } from "react";
import { CarListingFormData } from "@/types/forms";

// Export a function to get initial form values (for compatibility with other hooks)
export const getInitialFormValues = (): Partial<CarListingFormData> => {
  // Try to load valuation data from localStorage immediately
  try {
    const valuationDataStr = localStorage.getItem('valuationData');
    if (valuationDataStr) {
      const valuationData = JSON.parse(valuationDataStr);
      console.log('getInitialFormValues: Found valuation data in localStorage:', {
        reservePrice: valuationData.reservePrice,
        valuation: valuationData.valuation
      });
      
      const reservePrice = valuationData.reservePrice || valuationData.valuation || 0;
      
      return {
        ...DEFAULT_VALUES,
        fromValuation: true,
        valuationData: valuationData,
        make: valuationData.make || DEFAULT_VALUES.make,
        model: valuationData.model || DEFAULT_VALUES.model,
        year: valuationData.year || DEFAULT_VALUES.year,
        mileage: valuationData.mileage || DEFAULT_VALUES.mileage,
        vin: valuationData.vin || DEFAULT_VALUES.vin,
        reservePrice: reservePrice, // Set the reserve price from valuation
        transmission: (valuationData.transmission && 
          ["manual", "automatic", "semi-automatic"].includes(valuationData.transmission)) ?
          valuationData.transmission as "manual" | "automatic" | "semi-automatic" :
          DEFAULT_VALUES.transmission as "manual" | "automatic" | "semi-automatic",
        serviceHistoryType: DEFAULT_VALUES.serviceHistoryType as "full" | "partial" | "none"
      };
    }
  } catch (error) {
    console.error('getInitialFormValues: Error loading valuation data:', error);
  }
  
  return {
    ...DEFAULT_VALUES,
    transmission: DEFAULT_VALUES.transmission as "manual" | "automatic" | "semi-automatic",
    serviceHistoryType: DEFAULT_VALUES.serviceHistoryType as "full" | "partial" | "none"
  };
};

// For backward compatibility
export const getFormDefaults = getInitialFormValues;

export function useFormDefaults(fromValuation: boolean = false): Partial<CarListingFormData> {
  const [defaults, setDefaults] = useState<Partial<CarListingFormData>>(() => {
    // Initialize with data from getInitialFormValues
    return getInitialFormValues();
  });

  useEffect(() => {
    // If form is initialized from valuation, try to load the valuation data
    if (fromValuation) {
      try {
        const valuationDataStr = localStorage.getItem('valuationData');
        if (valuationDataStr) {
          const valuationData = JSON.parse(valuationDataStr);
          console.log("useFormDefaults: Loading form with valuation data:", {
            make: valuationData.make,
            model: valuationData.model,
            valuation: valuationData.valuation || valuationData.reservePrice,
            reservePrice: valuationData.reservePrice
          });

          // Ensure transmission is a valid enum value
          let transmissionValue: "manual" | "automatic" | "semi-automatic" = "manual";
          
          if (
            valuationData.transmission === "automatic" || 
            valuationData.transmission === "semi-automatic" || 
            valuationData.transmission === "manual"
          ) {
            transmissionValue = valuationData.transmission as "manual" | "automatic" | "semi-automatic";
          }

          // Ensure serviceHistoryType is a valid enum value
          const serviceHistoryValue: "full" | "partial" | "none" = 
            (valuationData.serviceHistoryType === "full" || 
             valuationData.serviceHistoryType === "partial") ? 
              valuationData.serviceHistoryType as "full" | "partial" : "none";

          const serviceHistoryTypeValue: "full" | "partial" | "none" = 
            (valuationData.service_history_type === "full" || 
             valuationData.service_history_type === "partial") ? 
              valuationData.service_history_type as "full" | "partial" : "none";

          // Determine reserve price from valuation - use strict priority order
          const reservePriceValue = valuationData.reservePrice || valuationData.valuation || 0;

          const valuationDefaults: Partial<CarListingFormData> = {
            ...DEFAULT_VALUES,
            fromValuation: true,
            valuationData: valuationData,
            make: valuationData.make || '',
            model: valuationData.model || '',
            year: valuationData.year || new Date().getFullYear(),
            mileage: valuationData.mileage || 0,
            vin: valuationData.vin || '',
            reservePrice: reservePriceValue,
            transmission: transmissionValue,
            serviceHistoryType: serviceHistoryTypeValue || serviceHistoryValue
          };

          console.log("useFormDefaults: Setting form defaults with reserve price:", {
            reservePrice: reservePriceValue
          });

          setDefaults(valuationDefaults);
        } else {
          console.warn("useFormDefaults: No valuation data found in localStorage despite fromValuation flag");
        }
      } catch (error) {
        console.error("useFormDefaults: Error loading valuation data:", error);
      }
    }
  }, [fromValuation]);

  return defaults;
}
