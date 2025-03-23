
/**
 * Changes made:
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 */

import { CarListingFormData, defaultCarFeatures } from "@/types/forms";

export const getFormDefaults = (): Partial<CarListingFormData> => ({
  name: "",
  address: "",
  mobileNumber: "",
  features: defaultCarFeatures,
  isDamaged: false,
  isRegisteredInPoland: false,
  hasDocumentation: false,
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
