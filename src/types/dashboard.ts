
/**
 * Changes made:
 * - 2024-09-05: Created dashboard types for SellerDashboard refactoring
 * - 2024-09-22: Updated CarListing interface to match what's used in the application
 * - 2024-09-23: Made several fields optional to match actual database structure
 */

import { CarFeatures } from "@/types/forms";

// Define the interface clearly to avoid conflicts
export interface CarListing {
  id: string;
  title: string;
  price: number;
  status?: string;
  created_at?: string;
  make: string;
  model: string;
  year: number;
  is_draft: boolean;
  is_auction?: boolean;
  auction_status?: string;
  description: string;
  features?: CarFeatures | null;
  seller_id?: string;
  mileage?: number;
  images?: string[] | null;
  updated_at?: string;
}
