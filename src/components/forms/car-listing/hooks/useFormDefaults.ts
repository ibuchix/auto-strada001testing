import { CarListingFormData } from "@/types/forms";
import { getDefaultCarFeatures } from "@/utils/typeGuards";

export const getFormDefaults = (): CarListingFormData => ({
  name: "",
  address: "",
  mobileNumber: "",
  isDamaged: false,
  isRegisteredInPoland: false,
  features: getDefaultCarFeatures(),
  seatMaterial: "cloth",
  numberOfKeys: "1",
  hasToolPack: false,
  hasDocumentation: false,
  isSellingOnBehalf: false,
  hasPrivatePlate: false,
  financeAmount: "",
  financeDocument: null,
  serviceHistoryType: "none",
  sellerNotes: "",
});