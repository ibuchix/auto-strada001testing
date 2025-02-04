import { Json } from "@/integrations/supabase/types";

export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
}

export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

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
  transmission: "manual" | "automatic" | null;
  seatMaterial: string;
  numberOfKeys: string;
  damageReports: any[];
  rimPhotos?: any;
  rimPhotosComplete: boolean;
  warningLightPhotos: string[];
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

export const transformFeaturesForDb = (features: CarFeatures): Json => {
  return features as unknown as Json;
};

export const transformFeaturesFromDb = (features: Json | null): CarFeatures => {
  if (!features) {
    return defaultCarFeatures;
  }
  return {
    ...defaultCarFeatures,
    ...(features as Record<string, boolean>)
  };
};