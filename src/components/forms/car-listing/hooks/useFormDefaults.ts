
/**
 * Changes made:
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field hasDocumentation
 * - 2025-06-10: Added defaultCarFeatures import
 * - 2025-08-04: Added missing required fields to default values
 * - 2025-08-21: Updated defaultFeatures to include new required properties
 */

import { CarListingFormData, defaultCarFeatures } from "@/types/forms";

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
  features: defaultCarFeatures, // Use the imported defaultCarFeatures with all required properties
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
