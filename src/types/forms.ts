
/**
 * Changes made:
 * - Added DamageType and DamageReport types
 * - Updated CarListingFormData to include damageReports
 * - Added defaultCarFeatures export
 * - Added AuctionStatus type
 * - Added CarListing type
 * - Made userId optional in CarListingFormData to fix type errors
 */

// Add or update the following types in forms.ts

// Adding DamageType and DamageReport types
export type DamageType = "scratch" | "dent" | "paint" | "glass" | "other";

export interface DamageReport {
  type: DamageType;
  description: string;
  photo?: string; // Optional photo path
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

// Define CarListing type
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

// Define AuctionStatus type
export type AuctionStatus = "scheduled" | "active" | "ended" | "cancelled";

// Ensure this type reflects the CarListing form shape
export interface CarListingFormData {
  vin: string;
  make: string;
  model: string;
  year: number;
  notes: string;
  address: string;
  features: CarFeatures;
  mileage: string | number;
  price: string | number;
  transmission: string;
  description: string;
  name: string;
  userId?: string; // Make userId optional to fix type errors
  uploadedPhotos: string[];
  location: string;
  // Add damageReports to the interface
  damageReports?: DamageReport[];
  // Add any other existing properties
  [key: string]: any;
}

export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
  [key: string]: boolean;
}

// Add any other necessary types
