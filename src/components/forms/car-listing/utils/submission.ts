
/**
 * Changes made:
 * - 2025-08-19: Updated to use toStringValue utility function
 * - Fixed type conversion issues
 * - 2025-08-20: Fixed type compatibility with string | number fields
 * - 2025-08-25: Added prepareSubmission function to transform form data to database entity
 */

import { CarListingFormData, CarEntity, AuctionStatus } from "@/types/forms";
import { toStringValue, toNumberValue } from "@/utils/typeConversion";

export const prepareFormDataForSubmission = (data: CarListingFormData) => {
  return {
    ...data,
    // Use toStringValue to ensure proper type conversion
    financeAmount: toStringValue(data.financeAmount),
  };
};

export const prepareFormDataForApi = (data: CarListingFormData) => {
  return {
    ...data,
    // Use toStringValue to ensure proper type conversion
    financeAmount: toStringValue(data.financeAmount),
  };
};

/**
 * Transforms form data into a database entity by removing transient properties
 * and adding required database fields
 * 
 * @param formData The form data to transform
 * @returns A CarEntity object ready for database submission
 */
export const prepareSubmission = (formData: CarListingFormData): CarEntity => ({
  ...formData,
  id: formData.id || '', // Ensure ID is always present for database
  created_at: formData.created_at || new Date(),
  updated_at: new Date(),
  status: 'draft' as AuctionStatus,
  // Strip transient properties
  form_metadata: undefined,
  formProgress: undefined,
  isValid: undefined
});
