
/**
 * Car service functions
 * - 2025-06-15: Fixed import issues and type references
 */

import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from '@supabase/supabase-js';
import { CarListing, AuctionStatus } from "@/types/forms";

export interface CarServiceResult<T> {
  data: T | null;
  error: PostgrestError | Error | null;
}

export class CarService {
  private supabase = supabase;

  /**
   * Get a car listing by ID
   */
  async getCarById(id: string): Promise<CarServiceResult<CarListing>> {
    try {
      const { data, error } = await this.supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error getting car:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get car listings with optional filtering
   */
  async getCars(options: {
    limit?: number;
    offset?: number;
    status?: string;
    auctionStatus?: AuctionStatus;
    userId?: string;
    isAuction?: boolean;
    orderBy?: string;
    ascending?: boolean;
  } = {}): Promise<CarServiceResult<CarListing[]>> {
    const {
      limit = 100,
      offset = 0,
      status,
      auctionStatus,
      userId,
      isAuction,
      orderBy = "created_at",
      ascending = false,
    } = options;

    try {
      let query = this.supabase
        .from("cars")
        .select("*")
        .order(orderBy, { ascending })
        .range(offset, offset + limit - 1);

      // Apply filters if provided
      if (status) {
        query = query.eq("status", status);
      }

      if (auctionStatus) {
        query = query.eq("auction_status", auctionStatus);
      }

      if (userId) {
        query = query.eq("seller_id", userId);
      }

      if (isAuction !== undefined) {
        query = query.eq("is_auction", isAuction);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error getting cars:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get active auctions
   */
  async getActiveAuctions(
    limit = 10,
    offset = 0
  ): Promise<CarServiceResult<CarListing[]>> {
    try {
      const { data, error } = await this.supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("auction_status", "active")
        .order("auction_end_time", { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error getting active auctions:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get cars for a seller
   */
  async getSellerCars(
    sellerId: string,
    status?: string
  ): Promise<CarServiceResult<CarListing[]>> {
    try {
      let query = this.supabase
        .from("cars")
        .select("*")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error getting seller cars:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update car listing
   */
  async updateCar(
    carId: string,
    updates: Partial<CarListing>
  ): Promise<CarServiceResult<CarListing>> {
    try {
      const { data, error } = await this.supabase
        .from("cars")
        .update(updates)
        .eq("id", carId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error updating car:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete car listing
   */
  async deleteCar(carId: string): Promise<CarServiceResult<null>> {
    try {
      const { error } = await this.supabase.from("cars").delete().eq("id", carId);

      if (error) {
        throw error;
      }

      return { data: null, error: null };
    } catch (error) {
      console.error("Error deleting car:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get car count by status
   */
  async getCarCountByStatus(): Promise<
    CarServiceResult<Record<string, number>>
  > {
    try {
      const { data, error } = await supabase.rpc("get_car_count_by_status");

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error getting car count by status:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get recent auctions for dashboard
   */
  async getRecentAuctions(
    limit = 5
  ): Promise<CarServiceResult<CarListing[]>> {
    try {
      const { data, error } = await this.supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error getting recent auctions:", error);
      return { data: null, error: error as Error };
    }
  }
}

export const carService = new CarService();
