
/**
 * Form submission utilities
 * Created: 2025-07-18
 */

import { CarListingFormData, CarEntity } from "@/types/forms";

/**
 * Prepares submission data by transforming form data
 */
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  // Ensure features property has all required fields
  const carFeatures = {
    satNav: formData.features?.satNav || false,
    panoramicRoof: formData.features?.panoramicRoof || false,
    reverseCamera: formData.features?.reverseCamera || false,
    heatedSeats: formData.features?.heatedSeats || false,
    upgradedSound: formData.features?.upgradedSound || false,
    bluetooth: formData.features?.bluetooth || false,
    sunroof: formData.features?.sunroof || false,
    alloyWheels: formData.features?.alloyWheels || false,
    ...(formData.features || {})
  };
  
  // Ensure all required fields are present with default values if needed
  const entity: Partial<CarEntity> = {
    ...formData,
    id: formData.id || '',
    created_at: formData.created_at ? new Date(formData.created_at) : new Date(),
    updated_at: new Date(),
    status: 'draft' as any,
    // Ensure required fields have values
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    price: formData.price || 0,
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    // Cast transmission to the expected type
    transmission: (formData.transmission || 'manual') as "manual" | "automatic",
    // Ensure features is properly typed
    features: carFeatures
  };
  
  // Remove transient properties that shouldn't be in the entity
  return {
    ...entity,
    form_metadata: undefined,
    isValid: undefined
  };
};
