export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
}

export interface CarListingFormData {
  name: string;
  address: string;
  mobileNumber: string;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  features: CarFeatures;
  seatMaterial: "cloth" | "leather" | "half leather" | "suede";
  numberOfKeys: "1" | "2";
  hasToolPack: boolean;
  hasDocumentation: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  financeAmount: string;
  financeDocument: File | null;
}