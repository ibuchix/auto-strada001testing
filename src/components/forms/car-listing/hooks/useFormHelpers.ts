
/**
 * Form Helper Hooks
 * Updated: 2025-05-24 - Updated field names to use camelCase consistently for frontend
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { CarListingFormData } from "@/types/forms";

// Export a function to get initial form values
export const getInitialFormValues = (): Partial<CarListingFormData> => {
  return {
    ...DEFAULT_VALUES,
    // Ensure proper typing for enum values
    transmission: DEFAULT_VALUES.transmission as "manual" | "automatic" | "semi-automatic",
    serviceHistoryType: DEFAULT_VALUES.serviceHistoryType as "full" | "partial" | "none"
  };
};

// Function to get form defaults with default values
export const getFormDefaults = (): Partial<CarListingFormData> => {
  return {
    isSellingOnBehalf: false,
    hasServiceHistory: false,
    hasPrivatePlate: false,
    hasOutstandingFinance: false,
    isDamaged: false,
    make: "",
    model: "",
    year: new Date().getFullYear(),
    mileage: 0,
    vin: "",
    price: 0,
    transmission: "manual" as "manual" | "automatic" | "semi-automatic",
    features: {
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
      keylessEntry: false,
      adaptiveCruiseControl: false,
      laneDepartureWarning: false
    },
    sellerId: "",
    serviceHistoryType: "none" as "none" | "partial" | "full",
    fromValuation: false
  };
};
