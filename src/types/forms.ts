
/**
 * Changes made:
 * - 2024-08-04: Fixed compatibility issues with DamageType and DamageReport interfaces
 * - 2024-08-04: Added Json conversion option for CarFeatures
 * - 2024-08-04: Consolidated DamageType definitions
 * - 2025-12-05: Updated CarFeatures to make properties required
 * - 2025-12-10: Fixed type incompatibility by consistently requiring all CarFeatures properties
 */

export interface CarListingFormData {
  vin: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  mileage: number;
  engineCapacity: number;
  transmission: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  numberOfDoors: string;
  seatMaterial: string;
  numberOfKeys: string;
  price: string;
  location: string;
  description: string;
  name: string;
  address: string;
  mobileNumber: string;
  contactEmail: string;
  notes: string;
  previousOwners: number;
  accidentHistory: string;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  financeAmount: string;
  serviceHistoryType: string;
  sellerNotes: string;
  conditionRating: number;
  features: CarFeatures;
  uploadedPhotos: string[];
  additionalPhotos: string[];
  requiredPhotos: {
    front: string | null;
    rear: string | null;
    interior: string | null;
    engine: string | null;
  };
  rimPhotos: {
    front_left: string | null;
    front_right: string | null;
    rear_left: string | null;
    rear_right: string | null;
  };
  warningLightPhotos: string[];
  rimPhotosComplete: boolean;
  financeDocument: string | null;
  serviceHistoryFiles: string[];
  userId?: string;
  damageReports?: DamageReport[];
}

// Unified damage type to resolve conflicts
export type DamageType = 'scratches' | 'dents' | 'paintwork' | 'windscreen' | 'bodywork' | 'mechanical' | 'electrical' | 'interior' | 'glass' | 'other';

export interface DamageReport {
  type: DamageType;
  description: string;
  photoPath: string;
}

export interface RimPhotos {
  front_left: string | null;
  front_right: string | null;
  rear_left: string | null;
  rear_right: string | null;
}

export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
}

// Helper function to convert CarFeatures to JSON-compatible object
export const carFeaturesToJson = (features: CarFeatures): Record<string, boolean> => {
  return {
    satNav: features.satNav,
    panoramicRoof: features.panoramicRoof,
    reverseCamera: features.reverseCamera,
    heatedSeats: features.heatedSeats,
    upgradedSound: features.upgradedSound
  };
};

// Ensure defaultCarFeatures has all required properties with default values
export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

export enum AuctionStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  SOLD = 'sold',
  CANCELLED = 'cancelled'
}

export interface CarListing {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  status: string;
  auction_status: AuctionStatus;
  seller_id: string;
  created_at: string;
  current_bid?: number;
  reserve_price?: number;
  photos: string[];
  features: CarFeatures;
  is_draft: boolean;
}
