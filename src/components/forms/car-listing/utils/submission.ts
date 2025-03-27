/**
 * Changes made:
 * - 2025-08-19: Updated to use toStringValue utility function
 * - Fixed type conversion issues
 */

import { CarListingFormData } from "@/types/forms";
import { toStringValue } from "@/utils/typeConversion";

export const prepareFormDataForSubmission = (data: CarListingFormData) => {
  return {
    ...data,
    financeAmount: toStringValue(data.financeAmount),
  };
};

export const prepareFormDataForApi = (data: CarListingFormData) => {
  return {
    ...data,
    financeAmount: toStringValue(data.financeAmount),
  };
};
