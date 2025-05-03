
/**
 * Form data type definitions
 * Created: 2025-07-18
 * Updated: 2025-07-23: Added additional form fields for the car listing form
 */

import { CarFeatures } from '@/utils/types/carFeatures';

export type DamageType = 'scratch' | 'dent' | 'paint' | 'glass' | 'mechanical' | 'structural' | 'other';

export interface DamageReport {
  id: string;
  description: string;
  location: string;
  photos: string[];
  photo?: string | null;
  severity: 'minor' | 'moderate' | 'severe';
  type?: DamageType;
}

export interface ServiceHistory {
  id: string;
  type: 'full' | 'partial';
  documents: string[];
  description?: string;
}

export interface ServiceHistoryFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date | string;
  type: string;
  size?: number;
}

export type AuctionStatus = 'draft' | 'pending' | 'active' | 'sold' | 'expired' | 'rejected';

export interface CarListingFormData {
  id?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  
  // Vehicle details
  make: string;
  model: string;
  year: number;
  mileage: number;
  vin: string;
  transmission: 'manual' | 'automatic';
  
  // Pricing
  price: number;
  reserve_price?: number;
  
  // Features
  features?: CarFeatures;
  
  // Photos
  uploadedPhotos: string[];
  vehiclePhotos?: Record<string, string[]>;
  damagePhotos?: string[];
  rimPhotos?: string[];
  
  // Photo fields
  frontView?: string;
  rearView?: string;
  driverSide?: string;
  passengerSide?: string;
  dashboard?: string;
  interiorFront?: string;
  interiorRear?: string;
  
  // Photo status
  requiredPhotosComplete?: boolean;
  rimPhotosComplete?: boolean;
  
  // Damage info
  isDamaged?: boolean;
  damageReports?: DamageReport[];
  
  // Service history
  serviceHistory?: ServiceHistory[];
  hasServiceHistory?: boolean;
  serviceHistoryType?: string;
  serviceHistoryFiles?: ServiceHistoryFile[];
  
  // Additional info
  conditionRating?: number;
  seatMaterial?: string;
  numberOfKeys?: string;
  isRegisteredInPoland?: boolean;
  hasWarningLights?: boolean;
  warningLightPhotos?: string[];
  hasOutstandingFinance?: boolean;
  financeAmount?: number;
  financeProvider?: string;
  financeEndDate?: string;
  financeDocument?: string;
  
  // Vehicle status
  hasPrivatePlate?: boolean;
  isSellingOnBehalf?: boolean;
  
  // Seller information
  name?: string;
  email?: string;
  mobileNumber?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  
  // Additional info
  sellerNotes?: string;
  
  // Form metadata (not stored in DB)
  form_metadata?: {
    lastStep?: number;
    progress?: number;
    draftSaved?: boolean;
    lastSaved?: string;
  };
  
  // For valuation data
  valuation_data?: any;
  
  // Validation status
  isValid?: boolean;
  
  // Status
  status?: AuctionStatus;
  is_draft?: boolean;
  
  // Supabase specific
  seller_id?: string;
}

export interface CarEntity extends CarListingFormData {
  id: string;
  user_id: string;
  status: AuctionStatus;
  created_at: Date;
  updated_at: Date;
}
