
/**
 * Transforms and normalizes car data
 * Updated: 2025-05-05 - Fixed TypeScript errors with features
 */

import { CarListingFormData, CarFeatures } from "@/types/forms";

/**
 * Transforms server car data into the form's expected format
 */
export function transformCarDataForForm(carData: any): CarListingFormData {
  // Create a features object with all required properties
  const features: CarFeatures = {
    // Required core properties
    airConditioning: false,
    bluetooth: false,
    cruiseControl: false,
    leatherSeats: false,
    navigation: false,
    parkingSensors: false,
    sunroof: false,
    satNav: false,
    panoramicRoof: false, 
    reverseCamera: false,
    heatedSeats: false,
    upgradedSound: false,
    alloyWheels: false,
    // Optional properties
    keylessEntry: false,
    adaptiveCruiseControl: false,
    laneDepartureWarning: false,
  };
  
  // Apply features from car data if available
  if (carData.features) {
    Object.entries(carData.features).forEach(([key, value]: [string, any]) => {
      if (key in features) {
        (features as any)[key] = !!value;
      }
    });
  }
  
  return {
    ...carData,
    // Ensure features is properly structured
    features,
    // Convert certain legacy properties to current names
    hasPrivatePlate: carData.hasPrivatePlate || carData.privateReg || false,
    hasOutstandingFinance: carData.hasOutstandingFinance || carData.hasFinance || false,
    registrationNumber: carData.registrationNumber || carData.registration_number || '',
    damageReports: carData.damageReports || carData.damages || [],
    // Ensure proper transmission value
    transmission: carData.transmission && (
      carData.transmission === 'manual' || 
      carData.transmission === 'automatic' || 
      carData.transmission === 'semi-automatic'
    ) ? carData.transmission : 'manual',
    // Set default serviceHistoryType if not present
    serviceHistoryType: carData.serviceHistoryType || 'none'
  };
}
