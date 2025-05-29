
/**
 * Changes made:
 * - 2024-09-05: Created dashboard types for SellerDashboard refactoring
 * - 2024-09-22: Updated CarListing interface to match what's used in the application
 * - 2024-09-23: Made several fields optional to match actual database structure
 * - 2025-05-08: Added valuation_data field to CarListing interface
 * - 2025-05-08: Added reserve_price field to CarListing interface
 * - 2025-05-08: Enhanced valuation_data interface with more detailed types
 * - 2025-05-29: REMOVED price and is_draft fields - using only reservePrice
 */

import { CarFeatures } from "@/types/forms";

// Define the interface clearly to avoid conflicts - REMOVED price and is_draft
export interface CarListing {
  id: string;
  title: string;
  reserve_price: number; // Using reserve_price instead of price
  status?: string;
  created_at?: string;
  make: string;
  model: string;
  year: number;
  description?: string; // Made optional with default
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
  // Additional fields to match DbCarListing
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
}
