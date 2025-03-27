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
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  vin: string;
  
  // Optional fields
  transmission?: "manual" | "automatic";
  notes?: string;
  address?: string;
  features?: CarFeatures;
  description?: string;
  name?: string;
  userId?: string;
  uploadedPhotos?: string[];
  location?: string;
  damageReports?: DamageReport[];
  
  // Form metadata
  form_metadata?: {
    currentStep?: number;
    lastSavedAt?: string;
    [key: string]: any;
  };
  
  // Other fields
  isDamaged?: boolean;
  isRegisteredInPoland?: boolean;
  isSellingOnBehalf?: boolean;
  hasPrivatePlate?: boolean;
  financeAmount?: string | number;
  financeDocument?: string | null;
  serviceHistoryType?: string;
  serviceHistoryFiles?: string[];
  sellerNotes?: string;
  mobileNumber?: string;
  registrationNumber?: string;
  conditionRating?: number;
  previousOwners?: number;
  contactEmail?: string;
  accidentHistory?: string;
  engineCapacity?: string | number;
  seatMaterial?: string;
  numberOfKeys?: string;
  
  [key: string]: any; // Allow for additional dynamic properties
}
