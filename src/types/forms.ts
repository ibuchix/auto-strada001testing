/**
 * Type definitions for car listing form data
 * - 2025-06-15: Added fuelType/fuel_type fields for car listing and entity
 * - 2025-06-15: Added `fuel_type` to CarEntity interface for DB consistency and bug fix (TS2353)
 * - Updated 2025-05-20: Added last_saved field to match database schema
 * - Updated 2025-05-21: Fixed field naming inconsistencies (camelCase to snake_case)
 * - Updated 2025-05-22: Added ServiceHistoryFile type and additional missing fields
 * - Updated 2025-05-23: Added warning_light fields and is_selling_on_behalf
 * - Updated 2025-05-24: Standardized to camelCase for frontend usage
 * - Updated 2025-05-27: Fixed missing RimPhotos interface export and field definitions
 * - Updated 2025-05-29: Added serviceHistoryCount to fix TypeScript errors
 * - Updated 2025-05-30: Fixed numberOfKeys type to be number | string for compatibility
 * - Updated 2025-06-01: Added name property for test compatibility
 * - Updated 2025-05-29: REMOVED price field - using only reservePrice (single pricing model)
 * - Updated 2025-06-13: Removed leatherSeats from CarFeatures (duplicate of seat material dropdown)
 */
export interface CarListingFormData {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  reservePrice?: number; // Single price field - the reserve price from valuation
  mileage?: number;
  features?: Record<string, boolean>;
  requiredPhotos?: Record<string, string>;
  isDraft?: boolean;
  isAuction?: boolean;
  auctionEndTime?: string;
  sellerId?: string;
  additionalPhotos?: string[];
  currentBid?: number;
  isDamaged?: boolean;
  formMetadata?: Record<string, any>;
  financeAmount?: number;
  isRegisteredInPoland?: boolean;
  valuationData?: Record<string, any>;
  hasPrivatePlate?: boolean;
  numberOfKeys?: number | string;
  hasServiceHistory?: boolean;
  title?: string;
  transmission?: string;
  images?: string[];
  status?: string;
  auctionStatus?: string;
  sellerNotes?: string;
  mobileNumber?: string;
  vin?: string;
  registrationNumber?: string;
  address?: string;
  sellerName?: string;
  name?: string;
  serviceHistoryType?: string;
  seatMaterial?: string;
  lastSaved?: string;
  serviceHistoryCount?: number;
  fuelType?: string; // Added: 2025-06-15
  
  // Frontend photo field names in camelCase
  frontView?: string;
  rearView?: string;
  driverSide?: string;
  passengerSide?: string;
  dashboard?: string;
  interiorFront?: string;
  interiorRear?: string;
  odometer?: string;
  
  // Additional fields for form usage
  damagePhotos?: string[];
  damageReports?: DamageReport[];
  financeProvider?: string;
  financeEndDate?: string;
  financeDocument?: string;
  hasOutstandingFinance?: boolean;
  hasWarningLights?: boolean;
  conditionRating?: number;
  contactEmail?: string;
  serviceHistoryFiles?: ServiceHistoryFile[];
  
  // New fields added for consistency with database schema
  warningLightPhotos?: string[];
  warningLightDescription?: string;
  isSellingOnBehalf?: boolean;
  uploadedPhotos?: string[];
  vehiclePhotos?: Record<string, string>;
  
  // Field for compatibility with existing code
  fromValuation?: boolean;
  
  // Added missing fields
  photoValidationPassed?: boolean;
  mainPhoto?: string;
  
  // Rim photos
  rimPhotos?: RimPhotos;
  
  // UI validation fields
  requiredPhotosComplete?: boolean;
  created_at?: string | Date;
  updatedAt?: string;
}

export type DamageType = 'scratch' | 'dent' | 'paint' | 'glass' | 'mechanical' | 'structural' | 'other';

export interface CarFeatures {
  airConditioning: boolean;
  bluetooth: boolean;
  cruiseControl: boolean;
  navigation: boolean;
  parkingSensors: boolean;
  sunroof: boolean;
  satNav: boolean;
  panoramicRoof: boolean;
  reverseCamera: boolean;
  heatedSeats: boolean;
  upgradedSound: boolean;
  alloyWheels: boolean;
  keylessEntry?: boolean;
  adaptiveCruiseControl?: boolean;
  laneDepartureWarning?: boolean;
}

export interface DamageReport {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  location?: string;
  photo?: string;
  type: DamageType;
}

export interface ServiceHistoryFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  uploadDate?: string; // Alternative property for compatibility
}

export interface RimPhotos {
  frontLeft?: string;
  frontRight?: string;
  rearLeft?: string;
  rearRight?: string;
}

/**
 * Car Entity represents the database schema for car records
 * - 2025-06-15: Added fuel_type to CarEntity interface
 */
export interface CarEntity {
  id: string;
  seller_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  reserve_price: number; // Single price field - NOT NULL in database
  mileage: number;
  transmission: 'manual' | 'automatic' | 'semi-automatic';
  features: CarFeatures;
  is_damaged: boolean;
  is_registered_in_poland: boolean;
  has_private_plate: boolean;
  finance_amount: number | null;
  service_history_type: 'none' | 'partial' | 'full';
  seller_notes?: string;
  seat_material?: string;
  number_of_keys: number | string;
  status: string;
  auction_status?: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  vin?: string;
  address?: string;
  mobile_number?: string;
  seller_name?: string;
  additional_photos?: any[];
  required_photos?: Record<string, string>;
  form_metadata?: any;
  valuation_data?: any;
  fuel_type?: string; // <-- Added this line to fix TS error and match DB
}

/**
 * Auction Status
 * - 2025-06-13: Added auctionStatus field to CarListingFormData
 */
export type AuctionStatus = 'open' | 'closed' | 'pending';
