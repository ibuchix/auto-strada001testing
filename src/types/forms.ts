
/**
 * Form Types
 * Created: 2025-06-15
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
  transmission: 'manual' | 'automatic';
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
}

export type DamageType = 'scratch' | 'dent' | 'collision' | 'mechanical' | 'electrical' | 'other';

export interface DamageReport {
  type: DamageType;
  description: string;
  photo: string | null;
  location?: string;
}

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
