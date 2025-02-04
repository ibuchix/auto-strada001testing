import { Json } from "@/integrations/supabase/types";

export interface CarFeatures {
  [key: string]: boolean;
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
  financeAmount?: string;
  financeDocument: File | null;
  serviceHistoryType: "full" | "partial" | "none" | "not_due";
  sellerNotes?: string;
  uploadedPhotos: string[];
  transmission?: string | null;
  seatMaterial: string;
  numberOfKeys: string;
  damageReports: any[];
  rimPhotos?: any;
  rimPhotosComplete: boolean;
  warningLightPhotos: string[];
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