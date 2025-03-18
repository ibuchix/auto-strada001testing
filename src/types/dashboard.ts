
/**
 * Changes made:
 * - 2024-09-05: Created dashboard types for SellerDashboard refactoring
 */

// Define the interface clearly to avoid conflicts
export interface CarListing {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
  make: string;
  model: string;
  year: number;
  is_draft: boolean;
  is_auction: boolean;
  description: string;
}
