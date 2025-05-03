
/**
 * Form submission utilities
 * Created: 2025-07-23
 * Updated: 2025-05-05 - Fixed type issues and removed missing references
 */

import { CarListingFormData, CarFeatures } from "@/types/forms";

export const prepareSubmission = (formData: CarListingFormData, userId: string): Partial<CarEntity> => {
  // Ensure features property has all required fields
  const carFeatures: CarFeatures = {
    airConditioning: formData.features?.airConditioning || false,
    bluetooth: formData.features?.bluetooth || false,
    cruiseControl: formData.features?.cruiseControl || false,
    leatherSeats: formData.features?.leatherSeats || false,
    navigation: formData.features?.navigation || false,
    parkingSensors: formData.features?.parkingSensors || false,
    sunroof: formData.features?.sunroof || false,
    satNav: formData.features?.satNav || false,
    panoramicRoof: formData.features?.panoramicRoof || false,
    reverseCamera: formData.features?.reverseCamera || false,
    heatedSeats: formData.features?.heatedSeats || false,
    upgradedSound: formData.features?.upgradedSound || false,
    alloyWheels: formData.features?.alloyWheels || false,
    keylessEntry: formData.features?.keylessEntry || false,
    adaptiveCruiseControl: formData.features?.adaptiveCruiseControl || false,
    laneDepartureWarning: formData.features?.laneDepartureWarning || false
  };
  
  // Ensure all required fields are present with default values if needed
  const entity: Partial<CarEntity> = {
    ...formData,
    id: formData.id || '',
    created_at: formData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'draft', // Using string literal instead of enum reference
    // Ensure required fields have values
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    price: formData.price || 0,
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    // Cast transmission to the expected type
    transmission: formData.transmission || 'manual',
    // Use properly typed features
    features: carFeatures
  };
  
  return entity;
};

// Define the interface here since it's referenced in the function
interface CarEntity {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  seller_id?: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'rejected';
  features: CarFeatures;
  vin: string;
  transmission: "manual" | "automatic" | "semi-automatic";
}
