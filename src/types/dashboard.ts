/**
 * Changes made:
 * - 2024-09-05: Created dashboard types for SellerDashboard refactoring
 * - 2024-09-22: Updated CarListing interface to match what's used in the application
 * - 2024-09-23: Made several fields optional to match actual database structure
 * - 2025-05-08: Added valuation_data field to CarListing interface
 * - 2025-05-08: Added reserve_price field to CarListing interface
 * - 2025-05-08: Enhanced valuation_data interface with more detailed types
 * - 2025-05-29: REMOVED price and is_draft fields - using only reservePrice
 * - 2025-06-15: Added auction_scheduled field to CarListing for approval/scheduling clarity
 * - 2025-06-15: Added fuel_type to CarListing for fuel type tracking
 */

import { CarFeatures } from "@/types/forms";

export interface CarListing {
  id: string;
  title: string;
  reserve_price: number;
  status?: string;
  created_at?: string;
  make: string;
  model: string;
  year: number;
  description?: string;
  features?: CarFeatures | null;
  seller_id?: string;
  mileage?: number;
  images?: string[] | null;
  updated_at?: string;
  valuation_data?: {
    reservePrice?: number;
    valuation?: number;
    basePrice?: number;
    priceMin?: number;
    priceMed?: number;
    priceMax?: number;
    mileage?: number;
    vin?: string;
    [key: string]: any;
  };
  current_bid?: number;
  auction_end_time?: string;
  auction_status?: string;
  additional_photos?: any;
  address?: string;
  finance_amount?: number;
  has_private_plate?: boolean;
  has_service_history?: boolean;
  is_damaged?: boolean;
  is_registered_in_poland?: boolean;
  mobile_number?: string;
  number_of_keys?: number;
  registration_number?: string;
  seat_material?: string;
  seller_notes?: string;
  service_history_type?: string;
  vin?: string;
  /** 
   * True if this car has been scheduled for auction but auction has not started yet.
   * Added: 2025-06-15
   */
  auction_scheduled?: boolean;
  fuel_type?: string; // Added 2025-06-15
}
