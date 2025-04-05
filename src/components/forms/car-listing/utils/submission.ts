
/**
 * Changes made:
 * - 2025-08-19: Updated to use toStringValue utility function
 * - Fixed type conversion issues
 * - 2025-08-20: Fixed type compatibility with string | number fields
 * - 2025-08-25: Added prepareSubmission function to transform form data to database entity
 * - 2025-12-03: Fixed type issues with required fields in CarEntity
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
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  // Ensure all required fields are present with default values if needed
  const entity: Partial<CarEntity> = {
    ...formData,
    id: formData.id || '',
    created_at: formData.created_at ? new Date(formData.created_at) : new Date(),
    updated_at: new Date(),
    status: 'draft' as AuctionStatus,
    // Ensure required fields have values
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    price: formData.price || 0,
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    // Cast transmission to the expected type
    transmission: (formData.transmission || 'manual') as "manual" | "automatic",
    // Strip transient properties
    form_metadata: undefined,
    formProgress: undefined,
    isValid: undefined
  };
  
  return entity;
};
