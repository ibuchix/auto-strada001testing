
/**
 * Form Types
 * Created: 2025-07-23
 * Updated: 2025-07-24 - Added missing fields to CarListingFormData
 * Updated: 2025-07-25 - Added additional required fields to fix type errors
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
  satNav: boolean;            // Added missing property
  panoramicRoof: boolean;     // Added missing property
  reverseCamera: boolean;     // Added missing property
  heatedSeats: boolean;       // Added missing property
  upgradedSound: boolean;     // Added missing property
  alloyWheels?: boolean;      // Added optional alloy wheels
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
  uploadedAt: string; // Required property
  uploadDate?: string; // Alternative property for compatibility
}

export interface RimPhotos {
  front_left: string;
  front_right: string;
  rear_left: string;
  rear_right: string;
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
  transmission?: "manual" | "automatic" | "semi-automatic"; // Added semi-automatic
  price?: number;
  reserve_price?: number;
  
  // Additional info
  features?: CarFeatures;
  uploadedPhotos?: string[];
  vehiclePhotos?: Record<string, string>;
  images?: string[]; // Added for ImageUploadSection
  
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
  
  // Additional fields
  damageReports?: DamageReport[];
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
  };
  mobileNumber?: string;
  
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
  
  // Status
  status?: 'draft' | 'pending' | 'approved' | 'active' | 'rejected';
}
