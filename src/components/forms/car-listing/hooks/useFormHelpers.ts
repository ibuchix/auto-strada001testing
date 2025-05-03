
/**
 * Form helpers utility functions
 * Created: 2025-07-27
 * Updated: 2025-05-03 - Fixed type issues with transmission
 * Updated: 2025-05-04 - Fixed type issues with default form values
 * Updated: 2025-05-04 - Ensuring type safety with proper typing for enums
 * Updated: 2025-05-05 - Fixed transmission type incompatibility issues
 * Centralized utility functions for form hooks
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { CarListingFormData } from "@/types/forms";

// Get initial form values (used by multiple hooks)
export const getInitialFormValues = (): Partial<CarListingFormData> => {
  // Type-safe default values
  return {
    isSellingOnBehalf: false,
    hasServiceHistory: false,
    hasPrivatePlate: false,
    hasOutstandingFinance: false,
    isDamaged: false,
    make: '',
    model: '',
    year: 0,
    mileage: 0,
    vin: '',
    transmission: "manual" as const,  // Type-safe transmission value
    serviceHistoryType: "none" as const,  // Type-safe serviceHistoryType
    fromValuation: false
  };
};

// Alias for backward compatibility
export const getFormDefaults = getInitialFormValues;
