/**
 * Form Types
 * Created: 2025-07-23
 * Updated: 2025-07-24 - Added missing fields to CarListingFormData
 * Updated: 2025-07-25 - Added additional required fields to fix type errors
 * Updated: 2025-07-26 - Fixed missing properties and type mismatches
 * Updated: 2025-05-04 - Added damageReports to fix TypeScript errors
 * Updated: 2025-05-04 - Added sellerDetails and correct field types
 * Updated: 2025-05-05 - Added missing fields for manual valuation
 * Updated: 2025-05-07 - Added ExtendedStoredFile type with uploadedAt property
 * Updated: 2025-05-08 - Fixed ExtendedStoredFile type to correctly include all properties
 * Updated: 2025-05-15 - Added financeAmount to CarEntity interface
 * Updated: 2025-05-27 - Updated field names to use consistent camelCase in frontend
 */

export type DamageType = 'scratch' | 'dent' | 'paint' | 'glass' | 'mechanical' | 'structural' | 'other';

export interface CarFeatures {
  airConditioning: boolean;
  bluetooth: boolean;
  cruiseControl: boolean;
  leatherSeats: boolean;
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
  front_left: string;
  front_right: string;
  rear_left: string;
  rear_right: string;
}

export interface SellerBankDetails {
  accountName?: string;
  accountNumber?: string;
  sortCode?: string;
}

export interface SellerAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface SellerDetails {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: SellerAddress;
  isPaymentInfoProvided?: boolean;
  bankDetails?: SellerBankDetails;
}

export interface StoredFile {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

// Extended version of StoredFile with uploadedAt property
export interface ExtendedStoredFile extends StoredFile {
  id?: string;
  uploadedAt: string;
}

// Add TempStoredFile type for temporary file upload hook
export interface TempStoredFile extends StoredFile {
  id: string;
  category?: string;
  preview?: string;
  uploaded?: boolean;
  uploadedAt: string;
  createdAt: Date;
}

// Add TemporaryFile type for temporary file management
export interface TemporaryFile {
  id: string;
  file: File;
  url: string;
  preview?: string;
  uploaded: boolean;
  uploadedAt: Date;
  category?: string;
  createdAt: Date;
}

export interface CarListingFormData {
  id?: string;
  name?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  
  // Vehicle basic info
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  vin?: string;
  transmission?: "manual" | "automatic" | "semi-automatic";
  price?: number;
  reservePrice?: number;
  
  // Additional info
  features?: CarFeatures;
  uploadedPhotos?: string[];
  vehiclePhotos?: Record<string, string>;
  images?: string[];
  
  // Status flags
  isDamaged?: boolean;
  hasServiceHistory?: boolean;
  isSellingOnBehalf?: boolean;
  hasPrivatePlate?: boolean;
  privateReg?: boolean; // For backward compatibility
  hasOutstandingFinance?: boolean;
  hasFinance?: boolean; // For backward compatibility
  hasWarningLights?: boolean;
  isRegisteredInPoland?: boolean;
  photoValidationPassed?: boolean;
  requiredPhotosComplete?: boolean;
  
  // Additional fields
  damageReports?: DamageReport[];
  damages?: DamageReport[]; // Added for backwards compatibility
  damagePhotos?: string[];
  serviceHistoryFiles?: ServiceHistoryFile[];
  serviceHistoryType?: 'full' | 'partial' | 'none';
  financeAmount?: number;
  financeProvider?: string;
  financeEndDate?: string;
  financeDocument?: string;
  numberOfKeys?: string | number;
  seatMaterial?: string;
  sellerNotes?: string;
  registrationNumber?: string;
  
  // Required photos for each section
  frontView?: string;
  rearView?: string;
  driverSide?: string;
  passengerSide?: string;
  dashboard?: string;
  interiorFront?: string;
  interiorRear?: string;
  odometer?: string;
  requiredPhotos?: Record<string, string>;
  
  // Warning lights
  warningLightPhotos?: string[];
  warningLightDescription?: string;
  
  // Rim photos
  rimPhotos?: RimPhotos;
  
  // Seller information
  sellerId?: string;
  sellerName?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | string;
  mobileNumber?: string;
  
  // Extended seller details
  sellerDetails?: SellerDetails;
  
  // Photos
  mainPhoto?: string;
  
  // Form metadata
  formMetadata?: {
    step?: number;
    lastSaved?: string;
    draftSaved?: boolean;
    lastVisitedSection?: string;
  };
  
  // Valuation data
  valuationData?: Record<string, any>;
  fromValuation?: boolean;
  
  // Status
  status?: 'draft' | 'pending' | 'approved' | 'active' | 'rejected';
  
  // Manual valuation specific fields
  conditionRating?: number;
  accidentHistory?: string;
  contactEmail?: string;
  previousOwners?: number;
  engineCapacity?: number;
  notes?: string;
  
  // Backend snake_case compatibility fields - these will be handled by the conversion utilities
  lastSaved?: string;
}

/**
 * Car Entity represents the database schema for car records
 */
export interface CarEntity {
  id: string;
  seller_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
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
  number_of_keys: number;
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
  reserve_price?: number;
}

// Add AuctionStatus export for submission.ts
export type AuctionStatus = 'draft' | 'pending' | 'approved' | 'active' | 'rejected';
