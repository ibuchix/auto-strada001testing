
/**
 * Changes made:
 * - Added DamageType and DamageReport types
 * - Updated CarListingFormData to include damageReports
 */

// Add or update the following types in forms.ts

// Adding DamageType and DamageReport types
export type DamageType = "scratch" | "dent" | "paint" | "glass" | "other";

export interface DamageReport {
  type: DamageType;
  description: string;
  photo?: string; // Optional photo path
}

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
  userId: string;
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
