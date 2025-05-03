
/**
 * Form data type definitions
 * Created: 2025-07-18
 */

import { CarFeatures } from '@/utils/types/carFeatures';

export interface DamageReport {
  id: string;
  description: string;
  location: string;
  photos: string[];
  severity: 'minor' | 'moderate' | 'severe';
}

export interface ServiceHistory {
  id: string;
  type: 'full' | 'partial';
  documents: string[];
  description?: string;
}

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
  
  // Damage info
  isDamaged?: boolean;
  damageReports?: DamageReport[];
  
  // Service history
  serviceHistory?: ServiceHistory[];
  
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
  
  // Validation status
  isValid?: boolean;
  
  // Status
  status?: 'draft' | 'pending' | 'active' | 'sold' | 'expired' | 'rejected';
}

export interface CarEntity extends CarListingFormData {
  id: string;
  user_id: string;
  status: 'draft' | 'pending' | 'active' | 'sold' | 'expired' | 'rejected';
  created_at: Date;
  updated_at: Date;
}
