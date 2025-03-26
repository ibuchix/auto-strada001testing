
/**
 * Created: 2025-08-19
 * Type definitions for form data
 * Updated: 2025-08-25: Added DamageType, DamageReport types and damageReports property
 * Updated: 2025-08-25: Added carFeaturesToJson and defaultCarFeatures
 */

// Damage types for car listing
export type DamageType = 'scratches' | 'dents' | 'paintwork' | 'windscreen' | 'bodywork' | 'mechanical' | 'electrical' | 'interior' | 'glass' | 'other';

// Damage report interface
export interface DamageReport {
  type: DamageType;
  description: string;
  photoPath?: string;
}

// Car features interface
export interface CarFeatures {
  satNav?: boolean;
  panoramicRoof?: boolean;
  reverseCamera?: boolean;
  heatedSeats?: boolean;
  upgradedSound?: boolean;
  [key: string]: boolean | undefined;
}

// Default car features
export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

// Helper function to convert CarFeatures to JSON
export const carFeaturesToJson = (features: CarFeatures): Record<string, boolean> => {
  return { ...features };
};

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
  damageReports?: DamageReport[];
  userId?: string;
}

// Auction status type
export type AuctionStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

// Car listing type for services
export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: string;
  images: string[];
  features: CarFeatures;
  created_at: string;
  status: string;
  auction_status: AuctionStatus | null;
  [key: string]: any;
}
