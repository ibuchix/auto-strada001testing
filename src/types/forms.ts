
/**
 * Changes made:
 * - 2024-07-24: Created forms.ts to define form data types
 * - 2024-08-01: Added damageReports array to CarListingFormData
 * - 2024-08-02: Added additional exported types: DamageType, DamageReport, CarFeatures, defaultCarFeatures
 * - 2024-08-03: Added CarListing and AuctionStatus types for carService
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

export type DamageType = 'bodywork' | 'mechanical' | 'electrical' | 'interior' | 'glass' | 'other';

export interface DamageReport {
  type: DamageType;
  description: string;
  photoPath: string;
}

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
}
