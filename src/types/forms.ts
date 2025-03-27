
/**
 * Changes made:
 * - Added DamageType and DamageReport types
 * - Updated CarListingFormData to include damageReports
 * - Added defaultCarFeatures export
 * - Added AuctionStatus type
 * - Added CarListing type
 * - Made CarListingFormData use Partial to fix type conflicts
 * - Fixed the transaction status mapping
 * - Added proper typing for CarListingFormData fields
 * - 2025-08-04: Fixed issue with required vs optional fields
 */

// Add or update the following types in forms.ts

// Adding DamageType and DamageReport types
export type DamageType = "scratch" | "dent" | "paint" | "glass" | "other";

export interface DamageReport {
  type: DamageType;
  description: string;
  photo?: string; // Optional photo path
}

// Define car features with all properties required
export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
  [key: string]: boolean;
}

// Add default car features export
export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

// Define transaction status types
export type TransactionStatus = "pending" | "success" | "error" | "idle";

// Define AuctionStatus type as a union of string literals with string fallback
export type AuctionStatus = "scheduled" | "active" | "ended" | "cancelled" | "sold" | string;

// Define CarListing type with auction_status as AuctionStatus
export interface CarListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  status: string;
  created_at: string;
  updated_at: string;
  auction_end_time?: string | null;
  auction_status?: AuctionStatus | null;
  [key: string]: any;
}

// Updated CarListingFormData interface with proper typing
export interface CarListingFormData {
  // Core required fields (these should always be present for a valid form)
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  vin: string;
  
  // Common fields that are required in most contexts
  name: string;
  address: string;
  mobileNumber: string;
  transmission: "manual" | "automatic" | null;
  features: CarFeatures;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  numberOfKeys: string;
  serviceHistoryType: string;
  sellerNotes: string;
  
  // Optional fields
  notes?: string;
  description?: string;
  userId?: string;
  uploadedPhotos?: string[];
  location?: string;
  damageReports?: DamageReport[];
  financeAmount?: string | number;
  financeDocument?: string | null;
  serviceHistoryFiles?: string[];
  conditionRating?: number;
  previousOwners?: number;
  contactEmail?: string;
  accidentHistory?: string;
  engineCapacity?: string | number;
  seatMaterial?: string;
  registrationNumber?: string;
  
  // Form metadata
  form_metadata?: {
    currentStep?: number;
    lastSavedAt?: string;
    [key: string]: any;
  };
  
  // Add any other fields that might be needed
  seller_id?: string;
  rimPhotosComplete?: boolean;
  warningLightPhotos?: string[];
  
  [key: string]: any; // Allow for additional dynamic properties
}
