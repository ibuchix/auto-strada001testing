
/**
 * Changes made:
 * - 2024-08-04: Fixed import for CarListing and AuctionStatus types
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { CarListing, AuctionStatus } from "@/types/forms";

export class CarService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient = supabase) {
    this.client = client;
  }

  /**
   * Fetch cars with optional filters
   */
  async getCars(
    filters: {
      sellerId?: string;
      status?: string;
      auctionStatus?: AuctionStatus;
      isDraft?: boolean;
      limit?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
      search?: string;
    } = {}
  ): Promise<CarListing[]> {
    const {
      sellerId,
      status,
      auctionStatus,
      isDraft,
      limit = 100,
      orderBy = 'created_at',
      orderDirection = 'desc',
      search
    } = filters;

    let query = this.client
      .from('cars')
      .select('*')
      .order(orderBy, { ascending: orderDirection === 'asc' })
      .limit(limit);

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (auctionStatus) {
      query = query.eq('auction_status', auctionStatus);
    }

    if (isDraft !== undefined) {
      query = query.eq('is_draft', isDraft);
    }

    if (search) {
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%,vin.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }

    return data as unknown as CarListing[];
  }

  /**
   * Get a single car by ID
   */
  async getCarById(id: string): Promise<CarListing | null> {
    const { data, error } = await this.client
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Car not found
      }
      console.error('Error fetching car:', error);
      throw error;
    }

    return data as unknown as CarListing;
  }

  /**
   * Update car status
   */
  async updateCarStatus(id: string, status: string): Promise<void> {
    const { error } = await this.client
      .from('cars')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating car status:', error);
      throw error;
    }
  }

  /**
   * Delete a car listing
   */
  async deleteCar(id: string): Promise<void> {
    const { error } = await this.client
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  }
}

export const carService = new CarService();
