import { Json } from "@/integrations/supabase/types";

export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
  [key: string]: boolean;
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

export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

export const transformFeaturesForDb = (features: CarFeatures): Json => {
  return features as unknown as Json;
};

export const transformFeaturesFromDb = (features: Json): CarFeatures => {
  const defaultFeatures = { ...defaultCarFeatures };
  if (typeof features === 'object' && features !== null) {
    return { ...defaultFeatures, ...features as Record<string, boolean> };
  }
  return defaultFeatures;
};