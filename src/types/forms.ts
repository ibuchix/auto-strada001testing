
/**
 * Changes made:
 * - 2024-03-19: Added CarListing form types
 * - 2024-06-03: Fixed type issues with mileage and price to be numbers
 * - 2024-06-03: Added missing damage report types
 */

// Car features
export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
  [key: string]: boolean;
}

// Photo references
export interface RequiredPhotos {
  front: string | null;
  rear: string | null;
  interior: string | null;
  engine: string | null;
}

export interface RimPhotos {
  front_left: string | null;
  front_right: string | null;
  rear_left: string | null;
  rear_right: string | null;
}

// Damage report types
export type DamageType = 'scratch' | 'dent' | 'crack' | 'mechanical' | 'electrical' | 'other';

export interface DamageReport {
  id: string;
  type: DamageType;
  description: string;
  photos: string[];
}

// Default values
export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false,
};

// Helper function to convert car features to JSON
export const carFeaturesToJson = (features: CarFeatures) => {
  return JSON.stringify(features);
};

// Main form data type
export interface CarListingFormData {
  vin: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  mileage: number; // Changed from string to number
  engineCapacity: string;
  transmission: string;
  bodyType: string;
  exteriorColor: string;
  interiorColor: string;
  numberOfDoors: string;
  seatMaterial: string;
  numberOfKeys: string;
  price: number; // Changed from string to number
  location: string;
  description: string;
  name: string;
  address: string;
  mobileNumber: string;
  contactEmail: string;
  notes: string;
  previousOwners: string;
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
  requiredPhotos: RequiredPhotos;
  rimPhotos: RimPhotos;
  warningLightPhotos: string[];
  rimPhotosComplete: boolean;
  financeDocument: string | null;
  serviceHistoryFiles: string[];
  damageReports?: DamageReport[]; // Added optional damage reports
}

// Car listing status
export enum AuctionStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Full car listing type
export interface CarListing extends CarListingFormData {
  id: string;
  sellerId: string;
  status: AuctionStatus;
  createdAt: string;
  updatedAt: string;
  startingBid: number;
  currentBid: number;
  reservePrice: number;
  startDate: string | null;
  endDate: string | null;
  viewCount: number;
}
