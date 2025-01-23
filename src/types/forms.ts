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
  features: CarFeatures;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  hasToolPack: boolean;
  hasDocumentation: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  financeAmount: string;
  financeDocument: File | null;
  serviceHistoryType: string;
  sellerNotes?: string;
  uploadedPhotos: string[];
  transmission?: string | null;
  seatMaterial: string;
  numberOfKeys: string;
  // Additional fields for manual valuation
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  engineCapacity?: number;
  mileage?: number;
  registrationNumber?: string;
  conditionRating?: number;
  accidentHistory?: boolean;
  previousOwners?: number;
  lastServiceDate?: string;
  interiorMaterial?: string;
  modifications?: string;
  fuelType?: string;
  color?: string;
  contactEmail?: string;
  notes?: string;
  serviceHistoryFiles?: string[];
}