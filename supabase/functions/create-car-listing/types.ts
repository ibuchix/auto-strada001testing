
/**
 * Type definitions for create-car-listing
 * Created: 2025-05-06 - Moved from external dependency to local implementation
 */

export interface ListingRequest {
  valuationData: any;
  userId: string;
  vin: string;
  mileage: number;
  transmission: string;
  reservationId?: string;
}

export interface ListingData {
  seller_id: string;
  seller_name: string;
  title: string;
  vin: string;
  mileage: number;
  transmission: string;
  make: string;
  model: string;
  year: number;
  price: number;
  valuation_data: any;
  is_draft: boolean;
  [key: string]: any;
}
