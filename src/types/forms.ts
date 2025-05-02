
/**
 * Form Types
 * Created: 2025-06-15
 * Updated: 2025-06-16 - Added valuation_data, form_metadata, and additional fields
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

export type AuctionStatus = 'draft' | 'pending' | 'active' | 'completed' | 'rejected';

export interface TempStoredFile {
  id: string;
  file: File;
  category: string;
  url: string;
  createdAt: Date;
}

export interface TemporaryFile {
  id: string;
  file: File;
  url: string;
}

export interface StepItem {
  id: string;
  title: string;
  description: string;
  sections: string[];
}
