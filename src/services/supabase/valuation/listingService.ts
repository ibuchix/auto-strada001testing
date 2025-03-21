
/**
 * Changes made:
 * - 2024-10-15: Extracted listing functionality from valuationService.ts
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

      // Verify the reservation is still valid
      const { data: reservation, error: reservationError } = await this.supabase
        .from('vin_reservations')
        .select('*')
        .eq('id', reservationId)
        .eq('status', 'active')
        .single();

      if (reservationError || !reservation) {
        throw new Error("Your VIN reservation has expired. Please start the process again.");
      }

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
