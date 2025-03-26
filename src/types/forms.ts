
/**
 * Created: 2025-08-19
 * Type definitions for form data
 * Changes made:
 * - 2025-12-12: Added DamageType, DamageReport types, damageReports to CarListingFormData, and utility functions
 */

// Simplified version of the car listing form data type for tests
export interface CarListingFormData {
  make: string;
  model: string;
  year: number;
  vin?: string;
  registrationNumber?: string;
  mileage: number;
  engineCapacity: number;
  transmission: 'manual' | 'automatic';
  bodyType: string;
  exteriorColor?: string;
  interiorColor?: string;
  numberOfDoors: string;
  seatMaterial: string;
  numberOfKeys: string;
  price: string | number;
  location?: string;
  description?: string;
  name?: string;
  address?: string;
  mobileNumber?: string;
  contactEmail?: string;
  notes?: string;
  previousOwners: number;
  accidentHistory: string;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  financeAmount?: string;
  serviceHistoryType: string;
  sellerNotes?: string;
  conditionRating: number;
  features: CarFeatures;
  uploadedPhotos: string[];
  additionalPhotos?: string[];
  requiredPhotos: {
    front: File | null;
    rear: File | null;
    interior: File | null;
    engine: File | null;
  };
  rimPhotos: {
    front_left: File | null;
    front_right: File | null;
    rear_left: File | null;
    rear_right: File | null;
  };
  warningLightPhotos?: string[];
  rimPhotosComplete: boolean;
  financeDocument: File | null;
  serviceHistoryFiles?: string[];
  userId?: string;
  damageReports?: DamageReport[]; // Add this property
}

export type DamageType = 'scratches' | 'dents' | 'paintwork' | 'windscreen' | 'bodywork' | 'mechanical' | 'electrical' | 'interior' | 'glass' | 'other';

export interface DamageReport {
  type: DamageType;
  description: string;
  photoPath?: string;
}

export interface CarFeatures {
  satNav?: boolean;
  panoramicRoof?: boolean;
  reverseCamera?: boolean;
  heatedSeats?: boolean;
  upgradedSound?: boolean;
  [key: string]: boolean | undefined;
}

export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false,
};

// Convert CarFeatures to plain JSON object for database compatibility
export const carFeaturesToJson = (features: CarFeatures): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  Object.entries(features).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      result[key] = value;
    }
  });
  return result;
};

export type AuctionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface CarListing extends Omit<CarListingFormData, 'features'> {
  id: string;
  features: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  seller_id: string;
  is_draft: boolean;
  is_auction: boolean;
  auction_status?: AuctionStatus;
  auction_end_time?: string;
  reserve_price?: number;
  current_bid?: number;
}
