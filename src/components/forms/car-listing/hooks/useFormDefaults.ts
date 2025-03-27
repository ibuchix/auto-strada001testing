
/**
 * Changes made:
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field hasDocumentation
 * - 2025-06-10: Added defaultCarFeatures import
 * - 2025-08-04: Added missing required fields to default values
 */

import { CarListingFormData } from "@/types/forms";

// Define default features inline instead of importing
const defaultFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

export const getFormDefaults = async (): Promise<Partial<CarListingFormData>> => ({
  // Required fields
  make: "",
  model: "",
  year: new Date().getFullYear(),
  price: 0,
  mileage: 0,
  vin: "",
  
  // Common fields
  name: "",
  address: "",
  mobileNumber: "",
  features: defaultFeatures,
  isDamaged: false,
  isRegisteredInPoland: false,
  isSellingOnBehalf: false,
  hasPrivatePlate: false,
  financeDocument: null,
  uploadedPhotos: [],
  seatMaterial: "",
  numberOfKeys: "1",
  serviceHistoryType: "none",
  sellerNotes: "",
  
  // Optional fields
  damageReports: [],
  rimPhotosComplete: false,
  warningLightPhotos: [],
  transmission: "manual"
});
