
/**
 * Form Types
 * Created: 2025-07-23
 * Updated: 2025-07-24 - Added missing fields to CarListingFormData
 * Updated: 2025-07-25 - Added additional required fields to fix type errors
 * Updated: 2025-07-26 - Fixed missing properties and type mismatches
 * Updated: 2025-05-04 - Added damageReports to fix TypeScript errors
 * Updated: 2025-05-04 - Added sellerDetails and correct field types
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
  reserve_price?: number;
  
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
  registration_number?: string;
  registrationNumber?: string; // For backward compatibility
  
  // Required photos for each section
  frontView?: string;
  rearView?: string;
  driverSide?: string;
  passengerSide?: string;
  dashboard?: string;
  interiorFront?: string;
  interiorRear?: string;
  requiredPhotosComplete?: boolean;
  
  // Warning lights
  warningLightPhotos?: string[];
  warningLightDescription?: string;
  
  // Rim photos
  rimPhotos?: RimPhotos;
  
  // Seller information
  seller_id?: string;
  seller_name?: string;
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
  form_metadata?: {
    step?: number;
    lastSaved?: string;
    draftSaved?: boolean;
    lastVisitedSection?: string;
  };
  
  // Valuation data
  valuation_data?: Record<string, any>;
  fromValuation?: boolean;
  
  // Status
  status?: 'draft' | 'pending' | 'approved' | 'active' | 'rejected';
}

// Add missing type that was referenced in errors
export interface CarEntity {
  id: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  seller_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoredFile {
  name: string;
  url: string;
  size?: number;
  type?: string;
}
