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
 * - 2025-08-20: Updated types based on user requirements
 * - 2025-08-20: Enhanced DamageType and DamageReport with additional fields
 * - 2025-08-20: Added new CarFeatures properties
 * - 2025-08-25: Ensured CarEntity type extends from CarListingFormData with required DB fields
 */

// DamageType with expanded options
export type DamageType = 
  | "scratch" 
  | "dent" 
  | "paint" 
  | "glass" 
  | "mechanical" 
  | "structural"
  | "other";

// Enhanced DamageReport with additional fields
export interface DamageReport {
  type: DamageType;
  description: string;
  photo: string | null; // Use null instead of optional for database compatibility
  location?: string; // Add damage location
  severity?: "minor" | "moderate" | "severe";
}

// Enhanced CarFeatures with additional properties
export interface CarFeatures {
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
  bluetooth: boolean;
  sunroof: boolean;
  alloyWheels: boolean;
  [key: string]: boolean;
}

// Updated defaultCarFeatures with new properties
export const defaultCarFeatures: CarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false,
  bluetooth: false,
  sunroof: false,
  alloyWheels: false
};

// Enhanced TransactionStatus type
export type TransactionStatus = 
  | "draft" 
  | "pending" 
  | "success" 
  | "error" 
  | "cancelled"
  | "idle"; // Keep 'idle' for compatibility with existing code

// Enhanced AuctionStatus type
export type AuctionStatus = 
  | "draft" 
  | "scheduled" 
  | "active" 
  | "ended" 
  | "cancelled" 
  | "sold";

// Enhanced CarListing type with additional fields
export interface CarListing {
  id: string;
  created_at: string;
  updated_at: string;
  seller_id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  vin: string;
  status: AuctionStatus;
  auction_end_time?: Date | null;
  // Add database-specific fields
  is_listed: boolean;
  is_approved: boolean;
  [key: string]: any; // Keep for backward compatibility
}

// Updated CarListingFormData interface with proper typing and database alignment
export interface CarListingFormData {
  // Required fields (these should always be present for a valid form)
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  vin: string;
  transmission: "manual" | "automatic";
  features: CarFeatures;
  
  // Conditional required fields
  damageReports: DamageReport[];
  uploadedPhotos: string[]; // Array of image URLs
  
  // Common fields that are required in most contexts
  name: string;
  address: string;
  mobileNumber: string;
  isDamaged: boolean;
  isRegisteredInPoland: boolean;
  isSellingOnBehalf: boolean;
  hasPrivatePlate: boolean;
  numberOfKeys: string;
  serviceHistoryType: string;
  
  // Optional fields
  notes?: string;
  description?: string;
  userId?: string;
  location?: string;
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
  sellerNotes?: string;
  
  // Metadata fields
  form_metadata?: {
    currentStep?: number;
    lastSavedAt?: string;
    [key: string]: any;
  };
  
  // Validation and progress fields
  formProgress?: {
    currentStep: number;
    completedSteps: number[];
  };
  isValid?: boolean;
  
  // Additional fields for compatibility
  seller_id?: string;
  rimPhotosComplete?: boolean;
  warningLightPhotos?: string[];
  
  [key: string]: any; // Allow for additional dynamic properties
}

// Database entity type - defines what gets stored in the database
export interface CarEntity extends Omit<CarListingFormData, 'formProgress' | 'isValid' | 'form_metadata'> {
  id: string;
  created_at: Date;
  updated_at: Date;
  status: AuctionStatus;
}
