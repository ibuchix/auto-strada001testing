
/**
 * Default Values for Car Listing Form
 * Updated: 2025-06-19 - Fixed property name issue
 */

import { CarListingFormData } from "@/types/forms";

export const DEFAULT_VALUES: Partial<CarListingFormData> = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  mileage: 0,
  vin: "",
  price: 0,
  transmission: "manual",
  features: {
    airConditioning: false,
    bluetooth: false,
    cruiseControl: false,
    leatherSeats: false,
    navigation: false,
    parkingSensors: false,
    sunroof: false
  },
  isDamaged: false,
  damageReports: [],
  hasServiceHistory: false,
  serviceHistoryType: "none",
  hasFinance: false,
  hasPrivatePlate: false,
  uploadedPhotos: [],
  images: [],
  photoIds: [],
  rimPhotosComplete: false,
  requiredPhotosComplete: false,
  // Removed 'name' property as it doesn't exist in CarListingFormData
  seller_id: "",
  seatMaterial: "",
  numberOfKeys: "1",
  hasOutstandingFinance: false,
  isRegisteredInPoland: true,
  hasWarningLights: false
};
