
/**
 * Changes made:
 * - 2025-06-02: Removed references to non-existent field has_documentation 
 */

import { Json } from "@/integrations/supabase/types";

export interface CarFeatures {
  [key: string]: boolean | undefined;
  satNav?: boolean;
  panoramicRoof?: boolean;
  reverseCamera?: boolean;
  heatedSeats?: boolean;
  upgradedSound?: boolean;
}

export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

export interface CarListingFormData {
  name?: string;
  address?: string;
  mobileNumber?: string;
  features?: CarFeatures;
  isDamaged?: boolean;
  isRegisteredInPoland?: boolean;
  isSellingOnBehalf?: boolean;
  hasPrivatePlate?: boolean;
  financeAmount?: string;
  financeDocument?: File | null;
  serviceHistoryType?: "full" | "partial" | "none" | "not_due";
  sellerNotes?: string;
  uploadedPhotos?: string[];
  transmission?: "manual" | "automatic" | null;
  seatMaterial?: string;
  numberOfKeys?: string;
  damageReports?: any[];
  rimPhotos?: {
    front_left?: string | null;
    front_right?: string | null;
    rear_left?: string | null;
    rear_right?: string | null;
  };
  rimPhotosComplete?: boolean;
  warningLightPhotos?: string[];
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

export type AuctionStatus = 'active' | 'ended' | 'sold' | 'cancelled' | null;

export interface CarListing {
  id?: string;
  title?: string;
  description?: string;
  seller_id?: string;
  make?: string;
  model?: string;
  year?: number;
  price: number;
  mileage?: number;
  features?: CarFeatures;
  is_draft: boolean;
  is_auction?: boolean;
  auction_status?: AuctionStatus;
  auction_end_time?: string | null;
  reserve_price?: number | null;
  current_bid?: number | null;
  minimum_bid_increment?: number;
  images?: string[] | null;
  vin?: string | null;
  transmission?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  seller_notes?: string | null;
  additional_photos?: Json | null;
  mobile_number?: string | null;
  is_damaged?: boolean;
  required_photos?: Json | null;
  form_metadata?: Json | null;
  registration_number?: string | null;
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
