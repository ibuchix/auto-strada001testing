import { CarListingFormData } from "@/types/forms";

export const getFormDefaults = (): Partial<CarListingFormData> => ({
  features: {
    satNav: false,
    panoramicRoof: false,
    reverseCamera: false,
    heatedSeats: false,
    upgradedSound: false
  },
  isDamaged: false,
  isRegisteredInPoland: false,
  hasToolPack: false,
  hasDocumentation: false,
  isSellingOnBehalf: false,
  hasPrivatePlate: false,
  financeDocument: null,
  uploadedPhotos: [],
});