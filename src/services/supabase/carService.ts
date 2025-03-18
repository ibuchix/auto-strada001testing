
/**
 * Changes made:
 * - 2024-09-11: Created car service for all car-related database operations
 * - 2024-09-12: Fixed TypeScript type errors by using literal strings for table names
 */

import { BaseService, Filter, QueryOptions } from "./baseService";
import { toast } from "sonner";

// Type definition for car data
export interface CarData {
  id?: string;
  title?: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  is_draft?: boolean;
  seller_id?: string;
  status?: string;
  transmission?: string;
  auction_status?: string;
  vin?: string;
  [key: string]: any; // Allow any other properties
}

export class CarService extends BaseService {
  
  /**
   * Get cars with optional filtering
   */
  async getCars(options: QueryOptions = {}): Promise<CarData[]> {
    try {
      let query = this.supabase
        .from('cars')
        .select(options.select || '*');
        
      // Apply filters if provided
      if (options.filters && options.filters.length > 0) {
        options.filters.forEach((filter: Filter) => {
          query = query.filter(filter.column, filter.operator, filter.value);
        });
      }
      
      // Apply ordering if provided
      if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending });
      } else {
        // Default ordering
        query = query.order('created_at', { ascending: false });
      }
      
      // Apply pagination if provided
      if (options.page !== undefined && options.pageSize !== undefined) {
        const from = options.page * options.pageSize;
        const to = from + options.pageSize - 1;
        query = query.range(from, to);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as CarData[];
    } catch (error: any) {
      this.handleError(error, "Failed to fetch cars");
    }
  }
  
  /**
   * Get a single car by ID
   */
  async getCarById(id: string): Promise<CarData> {
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('cars')
        .select('*')
        .eq('id', id)
        .single();
    });
  }
  
  /**
   * Create a new car listing
   */
  async createCar(carData: CarData): Promise<CarData> {
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('cars')
        .insert(carData)
        .select()
        .single();
    });
  }
  
  /**
   * Update an existing car listing
   */
  async updateCar(id: string, carData: Partial<CarData>): Promise<CarData> {
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('cars')
        .update(carData)
        .eq('id', id)
        .select()
        .single();
    });
  }
  
  /**
   * Upsert car data (create or update)
   */
  async upsertCar(carData: CarData): Promise<CarData> {
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('cars')
        .upsert(carData)
        .select()
        .single();
    });
  }
  
  /**
   * Delete a car listing
   */
  async deleteCar(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cars')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error: any) {
      this.handleError(error, "Failed to delete car");
    }
  }
  
  /**
   * Get seller's active listings
   */
  async getSellerActiveListings(sellerId: string): Promise<CarData[]> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_draft', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      this.handleError(error, "Failed to fetch seller's active listings");
    }
  }
  
  /**
   * Get seller's draft listings
   */
  async getSellerDraftListings(sellerId: string): Promise<CarData[]> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_draft', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      this.handleError(error, "Failed to fetch seller's draft listings");
    }
  }
  
  /**
   * Get seller's all listings
   */
  async getSellerAllListings(sellerId: string): Promise<CarData[]> {
    try {
      const { data, error } = await this.supabase
        .from('cars')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      this.handleError(error, "Failed to fetch seller's listings");
    }
  }
}

// Export a singleton instance
export const carService = new CarService();
