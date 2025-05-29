
/**
 * Hook for providing form defaults
 * Created: 2025-07-26
 * Updated: 2025-07-27 - Fixed type issues with transmission and serviceHistoryType
 * Updated: 2025-05-03 - Updated DEFAULT_VALUES to use proper typed values
 * Updated: 2025-05-04 - Fixed TypeScript errors with type assertions for enums
 * Updated: 2025-05-05 - Fixed type compatibility with transmission field 
 * Updated: 2025-05-06 - Fixed serviceHistoryType type compatibility issue
 * Updated: 2025-05-07 - Added explicit type casting for enum values
 * Updated: 2025-08-01 - Enhanced valuation data handling for strict price enforcement
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 * Updated: 2025-05-24 - Updated to consistently use camelCase field names for frontend
 * Updated: 2025-05-25 - Fixed field naming consistency to avoid TypeScript errors
 * Updated: 2025-05-26 - Fixed the DEFAULT_VALUES object to consistently use camelCase
 * Updated: 2025-05-29 - REMOVED price field - using only reservePrice
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
            model: valuationData.model,
            valuation: valuationData.valuation || valuationData.reservePrice,
            reservePrice: valuationData.reservePrice
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

          // Handle snake_case to camelCase conversion for specific fields
          const serviceHistoryTypeValue: "full" | "partial" | "none" = 
            (valuationData.service_history_type === "full" || 
             valuationData.service_history_type === "partial") ? 
              valuationData.service_history_type as "full" | "partial" : "none";

          // Determine reserve price from valuation - use strict priority order
          const reservePriceValue = valuationData.reservePrice || valuationData.valuation || 0;

          // Set default values based on valuation data
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
            // Ensure proper typing for enum values
            transmission: transmissionValue,
            serviceHistoryType: serviceHistoryTypeValue || serviceHistoryValue
          };

          console.log("Setting form defaults with reserve price:", {
            reservePrice: reservePriceValue
          });

          setDefaults(valuationDefaults);
        } else {
          console.warn("No valuation data found in localStorage despite fromValuation flag");
        }
      } catch (error) {
        console.error("Error loading valuation data:", error);
      }
    }
  }, [fromValuation]);

  return defaults;
}
