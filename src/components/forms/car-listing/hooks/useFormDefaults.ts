
/**
 * Hook for providing form defaults
 * Created: 2025-07-26
 * Handles default values and loading valuation data
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { useState, useEffect } from "react";
import { CarListingFormData } from "@/types/forms";

export function useFormDefaults(fromValuation: boolean = false): Partial<CarListingFormData> {
  const [defaults, setDefaults] = useState<Partial<CarListingFormData>>({
    ...DEFAULT_VALUES,
    fromValuation
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
            transmission: valuationData.transmission || "manual"
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
