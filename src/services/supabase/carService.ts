
/**
 * Changes made:
 * - 2024-09-11: Implemented CarService with basic CRUD operations
 * - 2024-09-16: Added retry and fallback logic for improved resilience
 * - 2024-09-17: Fixed TypeScript type errors and improved return types
 */

import { BaseService } from "./baseService";
import { toast } from "sonner";
import { CarListing, AuctionStatus } from "@/types/forms";

export class CarService extends BaseService {
  /**
   * Fetches a single car listing by ID with retry logic
   */
  async getCarById(id: string) {
    return this.withRetry(
      () => this.supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single(),
      {
        errorMessage: "Failed to load vehicle details",
        retryDelay: 800
      }
    );
  }
  
  /**
   * Fetches all car listings with configured filters and retry logic
   */
  async getCars(options: {
    status?: string;
    sellerId?: string;
    isAuction?: boolean;
    auctionStatus?: AuctionStatus;
    limit?: number;
    page?: number;
  } = {}) {
    const query = this.supabase
      .from("cars")
      .select("*");
      
    if (options.status) {
      query.eq("status", options.status);
    }
    
    if (options.sellerId) {
      query.eq("seller_id", options.sellerId);
    }
    
    if (options.isAuction !== undefined) {
      query.eq("is_auction", options.isAuction);
    }
    
    if (options.auctionStatus) {
      query.eq("auction_status", options.auctionStatus);
    }
    
    if (options.limit) {
      query.limit(options.limit);
    }
    
    // Add pagination if needed
    if (options.page && options.limit) {
      const offset = (options.page - 1) * options.limit;
      query.range(offset, offset + options.limit - 1);
    }
    
    return this.withRetry(
      () => query,
      {
        errorMessage: "Failed to load vehicle listings",
        fallbackValue: [],
        maxRetries: 2
      }
    );
  }
  
  /**
   * Fetches active car listings with retry logic
   */
  async getActiveListings(limit = 10) {
    return this.withRetry(
      () => this.supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .eq("is_draft", false)
        .order("created_at", { ascending: false })
        .limit(limit),
      {
        fallbackValue: [],
        errorMessage: "Failed to load active listings"
      }
    );
  }
  
  /**
   * Fetches cars with active auctions
   */
  async getActiveAuctions(limit = 10) {
    return this.withRetry(
      () => this.supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("auction_status", "active")
        .order("auction_end_time", { ascending: true })
        .limit(limit),
      {
        fallbackValue: [],
        errorMessage: "Failed to load active auctions"
      }
    );
  }
  
  /**
   * Fetches upcoming auctions
   */
  async getUpcomingAuctions(limit = 10) {
    return this.withRetry(
      () => this.supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .eq("status", "available")
        .is("auction_status", null)
        .order("created_at", { ascending: false })
        .limit(limit),
      {
        fallbackValue: [],
        errorMessage: "Failed to load upcoming auctions"
      }
    );
  }
  
  /**
   * Fetches completed auctions
   */
  async getCompletedAuctions(limit = 10) {
    return this.withRetry(
      () => this.supabase
        .from("cars")
        .select("*")
        .eq("is_auction", true)
        .or("auction_status.eq.ended,auction_status.eq.sold")
        .order("updated_at", { ascending: false })
        .limit(limit),
      {
        fallbackValue: [],
        errorMessage: "Failed to load auction history"
      }
    );
  }
  
  /**
   * Creates a new car listing with retry logic
   */
  async createCar(carData: Partial<CarListing>) {
    const result = await this.withRetry(
      () => this.supabase
        .from("cars")
        .insert(carData)
        .select(),
      {
        errorMessage: "Failed to create listing"
      }
    );
    
    if (result) {
      toast.success("Listing created successfully");
    }
    
    return result;
  }
  
  /**
   * Updates an existing car listing with retry logic
   */
  async updateCar(id: string, carData: Partial<CarListing>) {
    const result = await this.withRetry(
      () => this.supabase
        .from("cars")
        .update(carData)
        .eq("id", id)
        .select(),
      {
        errorMessage: "Failed to update listing"
      }
    );
    
    if (result) {
      toast.success("Listing updated successfully");
    }
    
    return result;
  }
  
  /**
   * Deletes a car listing with retry logic
   */
  async deleteCar(id: string) {
    const result = await this.withRetry(
      () => this.supabase
        .from("cars")
        .delete()
        .eq("id", id),
      {
        errorMessage: "Failed to delete listing"
      }
    );
    
    if (result) {
      toast.success("Listing deleted successfully");
    }
    
    return result;
  }
  
  /**
   * Fetches bids for a specific car
   */
  async getCarBids(carId: string) {
    return this.withRetry(
      () => this.supabase
        .from("bids")
        .select(`
          id,
          amount,
          status,
          created_at,
          dealer:dealer_id(id, dealership_name)
        `)
        .eq("car_id", carId)
        .order("created_at", { ascending: false }),
      {
        fallbackValue: [],
        errorMessage: "Failed to load bid history"
      }
    );
  }
}

// Export a singleton instance
export const carService = new CarService();
