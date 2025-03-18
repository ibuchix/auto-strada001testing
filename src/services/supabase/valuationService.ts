
/**
 * Changes made:
 * - 2024-09-11: Created valuation service for all valuation-related operations
 * - 2024-09-19: Optimized queries and improved caching for better performance
 * - 2024-09-20: Fixed issue with function invoke options
 */

import { BaseService } from "./baseService";
import { toast } from "sonner";

export interface ValuationData {
  make?: string;
  model?: string;
  year?: number;
  valuation?: number;
  price?: number;
  averagePrice?: number;
  reservePrice?: number;
  vin?: string;
  [key: string]: any;
}

export class ValuationService extends BaseService {
  /**
   * Get valuation for a VIN with optimized cache checking
   */
  async getValuation(vin: string, mileage: number, gearbox: string): Promise<ValuationData | null> {
    try {
      // Check cache first for performance
      const cachedData = await this.getCachedValuation(vin, mileage);
      if (cachedData) {
        console.log('Using cached valuation data for VIN:', vin);
        return cachedData;
      }
      
      const { data, error } = await this.supabase.functions.invoke('get-vehicle-valuation', {
        body: { vin, mileage, gearbox, context: 'home' },
        // Add request timeout without using 'options'
        headers: { 'X-Request-Timeout': '15000' }
      });
      
      if (error) throw error;
      
      // Cache the data for future requests
      if (data) {
        this.storeValuationCache(vin, mileage, data);
      }
      
      return data;
    } catch (error: any) {
      this.handleError(error, "Failed to get valuation");
      return null;
    }
  }
  
  /**
   * Get cached valuation for a VIN if available
   * Optimized with specific column selection
   */
  async getCachedValuation(vin: string, mileage: number): Promise<ValuationData | null> {
    try {
      const { data, error } = await this.supabase
        .from('vin_valuation_cache')
        .select('valuation_data, created_at')
        .eq('vin', vin)
        // Only get cache entries where the mileage is within 5% of the requested mileage
        .gte('mileage', mileage * 0.95)
        .lte('mileage', mileage * 1.05)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return null;
      }
      
      // Check if cache is expired (older than 30 days)
      const cacheDate = new Date(data[0].created_at);
      const now = new Date();
      const daysDifference = (now.getTime() - cacheDate.getTime()) / (1000 * 3600 * 24);
      
      if (daysDifference > 30) {
        return null;
      }
      
      return data[0].valuation_data as ValuationData;
    } catch (error: any) {
      console.error("Error fetching cached valuation:", error);
      return null;
    }
  }
  
  /**
   * Store valuation in cache with optimized insertion
   */
  async storeValuationCache(vin: string, mileage: number, valuationData: ValuationData): Promise<void> {
    try {
      // Check if an entry already exists to avoid duplication
      const { data, error: checkError } = await this.supabase
        .from('vin_valuation_cache')
        .select('id')
        .eq('vin', vin)
        .gte('mileage', mileage * 0.95)
        .lte('mileage', mileage * 1.05)
        .limit(1);
        
      if (checkError) {
        console.error("Error checking existing cache:", checkError);
        return;
      }
      
      // If entry exists, update it instead of inserting
      if (data && data.length > 0) {
        const { error } = await this.supabase
          .from('vin_valuation_cache')
          .update({ 
            valuation_data: valuationData,
            created_at: new Date().toISOString()
          })
          .eq('id', data[0].id);
          
        if (error) {
          console.error("Error updating valuation cache:", error);
        }
      } else {
        // Insert new cache entry
        const { error } = await this.supabase
          .from('vin_valuation_cache')
          .insert([{
            vin,
            mileage,
            valuation_data: valuationData
          }]);
          
        if (error) {
          console.error("Error storing valuation cache:", error);
        }
      }
    } catch (error: any) {
      console.error("Failed to store valuation in cache:", error);
    }
  }
  
  /**
   * Get seller valuation for VIN 
   */
  async getSellerValuation(vin: string, mileage: number, gearbox: string, userId: string): Promise<ValuationData | null> {
    try {
      const { data, error } = await this.supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'validate_vin',
          vin,
          mileage,
          gearbox,
          userId
        }
      });
      
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || "Failed to validate VIN");
      }
      
      return data.data;
    } catch (error: any) {
      this.handleError(error, "Failed to get valuation");
    }
  }
  
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
      this.handleError(error, "Failed to create listing");
    }
  }
}

// Export a singleton instance
export const valuationService = new ValuationService();
