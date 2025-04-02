
/**
 * Changes made:
 * - 2024-10-15: Extracted listing functionality from valuationService.ts
 * - 2025-06-12: Updated to use consolidated handle-seller-operations endpoint
 * - 2025-06-15: Refactored to use consolidated approach with combined operations
 * - 2025-11-23: Updated to use dedicated create-car-listing endpoint instead of consolidated function
 */

import { ValuationServiceBase, ValuationData } from "./valuationServiceBase";

export class ValuationListingService extends ValuationServiceBase {
  /**
   * Create a car listing from valuation data
   */
  async createCarListing(valuationData: ValuationData, userId: string, vin: string, mileage: number, transmission: string): Promise<any> {
    try {
      // Get the reservation ID from localStorage
      const reservationId = localStorage.getItem('vinReservationId');
      if (!reservationId) {
        throw new Error("No valid VIN reservation found. Please start the process again.");
      }

      // Call the dedicated create-car-listing edge function
      const { data, error } = await this.supabase.functions.invoke('create-car-listing', {
        body: {
          valuationData,
          userId,
          vin,
          mileage,
          transmission,
          reservationId
        }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.message || "Failed to create listing");
      }

      // Clear the reservation ID from localStorage after successful creation
      localStorage.removeItem('vinReservationId');

      return data.data;
    } catch (error: any) {
      return this.handleValuationError(error, "Failed to create listing");
    }
  }
}

// Export a singleton instance
export const valuationListingService = new ValuationListingService();
