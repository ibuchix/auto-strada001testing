
/**
 * Form helpers utility functions
 * Created: 2025-07-27
 * Updated: 2025-05-03 - Fixed type issues with transmission
 * Centralized utility functions for form hooks
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { CarListingFormData } from "@/types/forms";

// Get initial form values (used by multiple hooks)
export const getInitialFormValues = (): Partial<CarListingFormData> => {
  return DEFAULT_VALUES;
};

// Alias for backward compatibility
export const getFormDefaults = getInitialFormValues;
