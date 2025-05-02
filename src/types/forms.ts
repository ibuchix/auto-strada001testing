
/**
 * Form Types
 * Created: 2025-05-03
 * 
 * TypeScript type definitions for form data
 */

export type AuctionStatus = 'draft' | 'pending' | 'active' | 'ended' | 'sold' | 'cancelled';

export interface CarFeatures {
  satNav?: boolean;
  panoramicRoof?: boolean;
  reverseCamera?: boolean;
  heatedSeats?: boolean;
  upgradedSound?: boolean;
  bluetooth?: boolean;
  sunroof?: boolean;
  alloyWheels?: boolean;
  [key: string]: boolean | undefined;
}

export interface CarListingFormData {
  id?: string;
  created_at?: string;
  seller_id?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  vin?: string;
  price?: number;
  transmission?: 'manual' | 'automatic' | 'semi-automatic';
  fuel_type?: string;
  color?: string;
  body_type?: string;
  engine_size?: number;
  power?: number;
  reserve_price?: number;
  features?: CarFeatures;
  description?: string;
  condition_rating?: number;
  isSellingOnBehalf?: boolean;
  hasServiceHistory?: boolean;
  hasPrivatePlate?: boolean;
  hasFinance?: boolean;
  financeAmount?: number | string;
  isDamaged?: boolean;
  damageDescription?: string;
  additionalInfo?: string;
  photos?: string[];
  rimPhotos?: {
    front_left: string | null;
    front_right: string | null;
    rear_left: string | null;
    rear_right: string | null;
  };
  rimPhotosComplete?: boolean;
  requiredPhotosComplete?: boolean;
  photoIds?: {
    frontView?: string;
    rearView?: string;
    driverSide?: string;
    passengerSide?: string;
    dashboard?: string;
    interiorFront?: string;
    interiorRear?: string;
    additionalPhotos?: string[];
  };
  serviceHistoryFiles?: string[];
  damagePhotos?: string[];
  [key: string]: any;
}

export interface CarEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  seller_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  vin: string;
  transmission: 'manual' | 'automatic';
  fuel_type?: string;
  color?: string;
  body_type?: string;
  engine_size?: number;
  power?: number;
  status: AuctionStatus;
  auction_end_time?: string;
  current_bid?: number;
  reserve_price?: number;
  features?: CarFeatures;
  description?: string;
  condition_rating?: number;
  photos?: string[];
  address?: string;
  [key: string]: any;
}
