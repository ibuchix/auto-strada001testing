
/**
 * Hook for providing form defaults
 * Created: 2025-07-26
 * Updated: 2025-07-27 - Fixed type issues with transmission and serviceHistoryType
 * Updated: 2025-05-03 - Updated DEFAULT_VALUES to use proper typed values
 * Updated: 2025-05-04 - Fixed TypeScript errors with type assertions for enums
 * Updated: 2025-05-05 - Fixed type compatibility with transmission field 
 * Updated: 2025-05-06 - Fixed serviceHistoryType type compatibility issue
 * Updated: 2025-05-07 - Added explicit type casting for enum values
 * Handles default values and loading valuation data
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { useState, useEffect } from "react";
import { CarListingFormData } from "@/types/forms";

// Export a function to get initial form values (for compatibility with other hooks)
export const getInitialFormValues = (): Partial<CarListingFormData> => {
  return {
    ...DEFAULT_VALUES,
    // Ensure proper typing for enum values
    transmission: DEFAULT_VALUES.transmission as "manual" | "automatic" | "semi-automatic",
    serviceHistoryType: DEFAULT_VALUES.serviceHistoryType as "full" | "partial" | "none"
  };
};

// For backward compatibility
export const getFormDefaults = getInitialFormValues;

export function useFormDefaults(fromValuation: boolean = false): Partial<CarListingFormData> {
  const [defaults, setDefaults] = useState<Partial<CarListingFormData>>({
    ...DEFAULT_VALUES,
    // Ensure proper typing for enum values
    transmission: DEFAULT_VALUES.transmission as "manual" | "automatic" | "semi-automatic",
    serviceHistoryType: DEFAULT_VALUES.serviceHistoryType as "full" | "partial" | "none"
  });

  useEffect(() => {
    // If form is initialized from valuation, try to load the valuation data
    if (fromValuation) {
      try {
        // Look for valuation data in localStorage
        const valuationDataStr = localStorage.getItem('valuationData');
        if (valuationDataStr) {
          const valuationData = JSON.parse(valuationDataStr);
          console.log("Loading form with valuation data:", {
            make: valuationData.make,
            model: valuationData.model
          });

          // Ensure transmission is a valid enum value
          let transmissionValue: "manual" | "automatic" | "semi-automatic" = "manual";
          
          // Only set if the value is one of the allowed enum values
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

          // Set default values based on valuation data
          const valuationDefaults: Partial<CarListingFormData> = {
            ...DEFAULT_VALUES,
            fromValuation: true,
            valuation_data: valuationData,
            make: valuationData.make || '',
            model: valuationData.model || '',
            year: valuationData.year || new Date().getFullYear(),
            mileage: valuationData.mileage || 0,
            vin: valuationData.vin || '',
            price: valuationData.valuation || valuationData.reservePrice || 0,
            reserve_price: valuationData.reservePrice || 0,
            // Ensure proper typing for enum values
            transmission: transmissionValue,
            serviceHistoryType: serviceHistoryValue
          };

          setDefaults(valuationDefaults);
        }
      } catch (error) {
        console.error("Error loading valuation data:", error);
      }
    }
  }, [fromValuation]);

  return defaults;
}
