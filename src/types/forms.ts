
/**
 * Form Types
 * Created: 2025-06-15
 * Updated: 2025-06-16 - Added valuation_data, form_metadata, and additional fields
 * Updated: 2025-06-17 - Added isRegisteredInPoland, hasWarningLights and warningLightPhotos fields
 * Updated: 2025-06-18 - Added validate method to StepItem interface
 * Updated: 2025-06-19 - Fixed TempStoredFile and TemporaryFile compatibility
 * Updated: 2025-06-20 - Made interfaces fully compatible between TempStoredFile and TemporaryFile
 * Updated: 2025-06-21 - Added missing fields needed by form components (name, address, mobileNumber, etc.)
 * Updated: 2025-06-22 - Added additional fields needed by valuation forms and transaction components
 * 
 * TypeScript types for form handling
 */

export interface CarListingFormData {
  id?: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin: string;
  price: number;
  transmission: 'manual' | 'automatic' | 'semi-automatic';
  features?: Record<string, boolean>;
  isDamaged?: boolean;
  damageReports?: DamageReport[];
  hasServiceHistory?: boolean;
  serviceHistoryType?: 'full' | 'partial' | 'none';
  serviceHistoryFiles?: string[] | ServiceHistoryFile[];
  hasFinance?: boolean;
  financeAmount?: number;
  hasPrivatePlate?: boolean;
  privateReg?: string;
  uploadedPhotos?: string[];
  images?: string[];
  photoIds?: string[];
  rimPhotos?: {
    front_left?: string | null;
    front_right?: string | null;
    rear_left?: string | null;
    rear_right?: string | null;
  };
  rimPhotosComplete?: boolean;
  requiredPhotosComplete?: boolean;
  sellerNotes?: string;
  warningLightPhotos?: string[];
  isSellingOnBehalf?: boolean;
  valuation_data?: Record<string, any>;
  form_metadata?: {
    currentStep?: number;
    lastSavedAt?: string;
    completedSteps?: number[];
    validatedSections?: string[];
  };
  seller_id?: string;
  reserve_price?: number;
  
  // Additional fields needed based on errors
  seatMaterial?: string;
  numberOfKeys?: string;
  hasOutstandingFinance?: boolean;
  financeProvider?: string;
  financeEndDate?: string;
  financeDocument?: string;
  isRegisteredInPoland?: boolean;
  hasWarningLights?: boolean;
  
  // Required photo fields for each view
  frontView?: string;
  rearView?: string;
  driverSide?: string;
  passengerSide?: string;
  dashboard?: string;
  interiorFront?: string;
  interiorRear?: string;
  damagePhotos?: string[];
  vehiclePhotos?: {
    frontView?: string;
    rearView?: string;
    driverSide?: string;
    passengerSide?: string;
    dashboard?: string;
    interiorFront?: string;
    interiorRear?: string;
  };
  
  // Added for validation purposes
  photoValidationPassed?: boolean;
  mainPhoto?: string;
  
  // Fields needed for personal details and registration
  name?: string;
  address?: string;
  mobileNumber?: string;
  registration_number?: string;
  title?: string;
  
  // New fields for manual valuation form
  conditionRating?: number;
  accidentHistory?: string;
  contactEmail?: string;
  previousOwners?: number;
  engineCapacity?: number;
  notes?: string;
  registrationNumber?: string;
  
  // Data storage for component state
  created_at?: string | Date;
  updated_at?: string | Date;
  formProgress?: any;
  isValid?: boolean;
}

export interface DamageReport {
  type: DamageType;
  description: string;
  photo: string | null;
  location?: string;
  severity?: 'minor' | 'moderate' | 'severe';
}

export type DamageType = 'scratch' | 'dent' | 'collision' | 'mechanical' | 'electrical' | 'other';

export interface ServiceHistoryFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadDate: string;
}

// Default car features configuration
export const defaultCarFeatures = {
  airConditioning: false,
  bluetooth: false,
  cruiseControl: false,
  leatherSeats: false,
  navigation: false,
  parkingSensors: false,
  sunroof: false
};

export interface CarEntity extends CarListingFormData {
  created_at: Date;
  updated_at: Date;
  status: AuctionStatus;
}

// Define CarFeatures interface
export interface CarFeatures {
  satNav?: boolean;
  panoramicRoof?: boolean;
  reverseCamera?: boolean;
  heatedSeats?: boolean;
  upgradedSound?: boolean;
  bluetooth?: boolean;
  sunroof?: boolean;
  alloyWheels?: boolean;
  airConditioning?: boolean;
  cruiseControl?: boolean;
  leatherSeats?: boolean;
  navigation?: boolean;
  parkingSensors?: boolean;
  [key: string]: boolean | undefined;
}

export type AuctionStatus = 'draft' | 'pending' | 'active' | 'completed' | 'rejected';

// Add TransactionStatus to fix import errors
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELED = 'canceled',
  TIMEOUT = 'timeout'
}

// Updated to make fully compatible with TemporaryFile
export interface TempStoredFile {
  id: string;
  file: File;
  category?: string;
  url: string;
  createdAt?: Date;
  preview?: string;
  uploaded?: boolean;
  uploadedAt?: Date | null;
}

// Updated to make fully compatible with TempStoredFile
export interface TemporaryFile {
  id: string;
  file: File;
  url: string;
  preview?: string;
  uploaded?: boolean;
  uploadedAt?: Date | null;
  category?: string;
  createdAt?: Date;
}

export interface StepItem {
  id: string;
  title: string;
  description: string;
  sections: string[];
  validate?: (data: CarListingFormData) => boolean;
}

// Add CarListing type for carService.ts
export interface CarListing extends CarListingFormData {
  id: string;
  seller_id: string;
  status: AuctionStatus;
  created_at: string | Date;
  updated_at: string | Date;
}
