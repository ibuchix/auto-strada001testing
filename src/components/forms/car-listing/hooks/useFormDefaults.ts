
/**
 * useFormDefaults Hook
 * Updated: 2025-06-19 - Fixed property name issue
 */

import { useCallback, useMemo } from "react";
import { DEFAULT_VALUES } from "../constants/defaultValues";
import { CarListingFormData } from "@/types/forms";

export interface FormDefaults {
  // Add all the properties we need from the form here
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  vin?: string;
  price?: number;
  transmission?: "manual" | "automatic" | "semi-automatic";
  reserve_price?: number;
  serviceHistoryType?: string;
  seller_id?: string;
  // Add more as needed
}

export const useFormDefaults = (initialDefaults?: FormDefaults) => {
  // Merge user-provided defaults with system defaults
  const getDefaults = useCallback(
    (userDefaults?: FormDefaults): Partial<CarListingFormData> => {
      if (!userDefaults) {
        return DEFAULT_VALUES;
      }

      return {
        ...DEFAULT_VALUES,
        make: userDefaults.make || DEFAULT_VALUES.make,
        model: userDefaults.model || DEFAULT_VALUES.model,
        year: userDefaults.year || DEFAULT_VALUES.year,
        mileage: userDefaults.mileage || DEFAULT_VALUES.mileage,
        vin: userDefaults.vin || DEFAULT_VALUES.vin,
        price: userDefaults.price || DEFAULT_VALUES.price,
        transmission: userDefaults.transmission || DEFAULT_VALUES.transmission,
        reserve_price: userDefaults.reserve_price || 0,
        serviceHistoryType: userDefaults.serviceHistoryType || DEFAULT_VALUES.serviceHistoryType,
        seller_id: userDefaults.seller_id || DEFAULT_VALUES.seller_id,
        // Removed name property as it doesn't exist in CarListingFormData
      };
    },
    []
  );

  // Compute defaults once based on provided initialDefaults
  const defaults = useMemo(() => getDefaults(initialDefaults), [getDefaults, initialDefaults]);

  return {
    defaults,
    getDefaults,
  };
};
