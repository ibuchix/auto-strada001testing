
/**
 * Changes made:
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field hasDocumentation
 * - 2025-06-10: Added defaultCarFeatures import
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

export const getFormDefaults = (): Partial<CarListingFormData> => ({
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
  damageReports: [],
  rimPhotosComplete: false,
  warningLightPhotos: [],
  transmission: null
});
