
/**
 * Form Helper Hooks
 * Updated: 2025-05-20 - Updated field names to use snake_case to match database schema
 */

import { DEFAULT_VALUES } from "../constants/defaultValues";
import { CarListingFormData } from "@/types/forms";

// Export a function to get initial form values
export const getInitialFormValues = (): Partial<CarListingFormData> => {
  return {
    ...DEFAULT_VALUES,
    // Ensure proper typing for enum values
    transmission: DEFAULT_VALUES.transmission as "manual" | "automatic" | "semi-automatic",
    service_history_type: DEFAULT_VALUES.service_history_type as "full" | "partial" | "none"
  };
};

// Function to get form defaults with default values
export const getFormDefaults = (): Partial<CarListingFormData> => {
  return {
    is_selling_on_behalf: false,
    has_service_history: false,
    has_private_plate: false,
    has_outstanding_finance: false,
    is_damaged: false,
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
    seller_id: "",
    service_history_type: "none" as "none" | "partial" | "full",
    from_valuation: false
  };
};
