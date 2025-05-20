
/**
 * Type definitions for car listing form data
 * - Updated 2025-05-20: Added last_saved field to match database schema
 * - Updated 2025-05-21: Fixed field naming inconsistencies (camelCase to snake_case)
 */
export interface CarListingFormData {
  id?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  features?: Record<string, boolean>;
  required_photos?: Record<string, string>;
  is_draft?: boolean;
  is_auction?: boolean;
  auction_end_time?: string;
  reserve_price?: number;
  seller_id?: string;
  additional_photos?: string[];
  current_bid?: number;
  is_damaged?: boolean;
  form_metadata?: Record<string, any>;
  finance_amount?: number;
  is_registered_in_poland?: boolean;
  valuation_data?: Record<string, any>;
  has_private_plate?: boolean;
  number_of_keys?: number;
  has_service_history?: boolean;
  title?: string;
  transmission?: string;
  images?: string[];
  status?: string;
  auction_status?: string;
  seller_notes?: string;
  mobile_number?: string;
  vin?: string;
  registration_number?: string;
  address?: string;
  seller_name?: string;
  service_history_type?: string;
  seat_material?: string;
  last_saved?: string;
  
  // Additional fields that may be needed by the form but not in the database schema
  damage_photos?: string[];
  damage_reports?: DamageReport[];
  finance_provider?: string;
  finance_end_date?: string;
  finance_document?: string;
  has_outstanding_finance?: boolean;
  has_warning_lights?: boolean;
  condition_rating?: number;
  contact_email?: string;
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
