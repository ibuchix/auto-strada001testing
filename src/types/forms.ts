
/**
 * Type definitions for car listing form data
 * - Updated 2025-05-20: Added last_saved field to match database schema
 * - Updated 2025-05-21: Fixed field naming inconsistencies (camelCase to snake_case)
 * - Updated 2025-05-22: Added ServiceHistoryFile type and additional missing fields
 * - Updated 2025-05-23: Added warning_light fields and is_selling_on_behalf
 * - Updated 2025-05-23: Added photo_validation_passed and main_photo fields
 * - Updated 2025-05-24: Standardized to camelCase for frontend usage
 */
export interface CarListingFormData {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  features?: Record<string, boolean>;
  requiredPhotos?: Record<string, string>;
  isDraft?: boolean;
  isAuction?: boolean;
  auctionEndTime?: string;
  reservePrice?: number;
  sellerId?: string;
  additionalPhotos?: string[];
  currentBid?: number;
  isDamaged?: boolean;
  formMetadata?: Record<string, any>;
  financeAmount?: number;
  isRegisteredInPoland?: boolean;
  valuationData?: Record<string, any>;
  hasPrivatePlate?: boolean;
  numberOfKeys?: number;
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
  serviceHistoryType?: string;
  seatMaterial?: string;
  lastSaved?: string;
  
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
}

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
