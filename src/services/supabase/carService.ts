
/**
 * Changes made:
 * - 2024-09-11: Implemented CarService with basic CRUD operations
 * - 2024-09-16: Added retry and fallback logic for improved resilience
 * - 2024-09-17: Fixed TypeScript type errors and improved return types
 * - 2024-09-18: Updated withRetry method implementation to fix type compatibility
 * - 2024-09-19: Optimized queries for better performance and reduced latency
 * - 2024-09-21: Updated to properly respect RLS policies
 */

import { BaseService } from "./baseService";
import { toast } from "sonner";
import { CarListing, AuctionStatus } from "@/types/forms";

export class CarService extends BaseService {
  /**
   * Fetches a single car listing by ID with retry logic and optimized selection
   * RLS Compliant: Users can only view non-draft listings or their own listings
   */
  async getCarById(id: string, select: string = '*') {
    return this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .select(select)
          .eq("id", id)
          .single();
      },
      {
        errorMessage: "Failed to load vehicle details",
        retryDelay: 800
      }
    );
  }
  
  /**
   * Fetches all car listings with configured filters and retry logic
   * Optimized with column selection and pagination
   */
  async getCars(options: {
    status?: string;
    sellerId?: string;
    isAuction?: boolean;
    auctionStatus?: AuctionStatus;
    limit?: number;
    page?: number;
    select?: string;
  } = {}) {
    const {
      select = '*',
      page = 1,
      limit = 20
    } = options;
    
    return this.withRetry(
      async () => {
        let query = this.supabase
          .from("cars")
          .select(select);
          
        if (options.status) {
          query = query.eq("status", options.status);
        }
        
        if (options.sellerId) {
          query = query.eq("seller_id", options.sellerId);
        }
        
        if (options.isAuction !== undefined) {
          query = query.eq("is_auction", options.isAuction);
        }
        
        if (options.auctionStatus) {
          query = query.eq("auction_status", options.auctionStatus);
        }
        
        // Apply pagination efficiently using range
        if (page && limit) {
          const start = (page - 1) * limit;
          const end = start + limit - 1;
          query = query.range(start, end);
        } else if (limit) {
          query = query.limit(limit);
        }
        
        // Sort by most recently updated for better relevance
        query = query.order("updated_at", { ascending: false });
        
        return query;
      },
      {
        errorMessage: "Failed to load vehicle listings",
        fallbackValue: [],
        maxRetries: 2
      }
    );
  }
  
  /**
   * Fetches active car listings with retry logic and optimized selection
   */
  async getActiveListings(limit = 10, select = '*') {
    return this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .select(select)
          .eq("status", "available")
          .eq("is_draft", false)
          .order("created_at", { ascending: false })
          .limit(limit);
      },
      {
        fallbackValue: [],
        errorMessage: "Failed to load active listings"
      }
    );
  }
  
  /**
   * Fetches cars with active auctions, optimized with specific field selection
   */
  async getActiveAuctions(limit = 10) {
    const select = 'id, title, make, model, year, price, current_bid, images, auction_end_time';
    
    return this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .select(select)
          .eq("is_auction", true)
          .eq("auction_status", "active")
          .order("auction_end_time", { ascending: true })
          .limit(limit);
      },
      {
        fallbackValue: [],
        errorMessage: "Failed to load active auctions"
      }
    );
  }
  
  /**
   * Fetches upcoming auctions with optimized field selection
   */
  async getUpcomingAuctions(limit = 10) {
    const select = 'id, title, make, model, year, price, images, created_at';
    
    return this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .select(select)
          .eq("is_auction", true)
          .eq("status", "available")
          .is("auction_status", null)
          .order("created_at", { ascending: false })
          .limit(limit);
      },
      {
        fallbackValue: [],
        errorMessage: "Failed to load upcoming auctions"
      }
    );
  }
  
  /**
   * Fetches completed auctions with optimized field selection
   */
  async getCompletedAuctions(limit = 10) {
    const select = 'id, title, make, model, year, price, current_bid, images, updated_at, auction_status';
    
    return this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .select(select)
          .eq("is_auction", true)
          .or("auction_status.eq.ended,auction_status.eq.sold")
          .order("updated_at", { ascending: false })
          .limit(limit);
      },
      {
        fallbackValue: [],
        errorMessage: "Failed to load auction history"
      }
    );
  }
  
  /**
   * Creates a new car listing with retry logic
   * Only returns essential fields after creation
   * RLS Compliant: Users can only create listings with their own seller_id
   */
  async createCar(carData: Partial<CarListing>) {
    // Verify that the seller_id in carData matches the authenticated user's ID
    const { data: session } = await this.supabase.auth.getSession();
    
    if (session?.session && carData.seller_id && carData.seller_id !== session.session.user.id) {
      toast.error("Permission Denied", {
        description: "You can only create listings for yourself."
      });
      return null;
    }
    
    const result = await this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .insert(carData)
          .select('id, title, created_at');
      },
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
   * Only returns essential fields after update
   * RLS Compliant: Users can only update their own draft listings
   */
  async updateCar(id: string, carData: Partial<CarListing>) {
    const result = await this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .update(carData)
          .eq("id", id)
          .select('id, title, updated_at');
      },
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
   * RLS Compliant: Users can only delete their own listings
   */
  async deleteCar(id: string) {
    const result = await this.withRetry(
      async () => {
        return this.supabase
          .from("cars")
          .delete()
          .eq("id", id);
      },
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
   * Fetches bids for a specific car with optimized field selection
   * RLS Compliant: Only accessible to the car's seller or admin users
   */
  async getCarBids(carId: string) {
    return this.withRetry(
      async () => {
        return this.supabase
          .from("bids")
          .select(`
            id,
            amount,
            status,
            created_at,
            dealer:dealer_id(id, dealership_name)
          `)
          .eq("car_id", carId)
          .order("created_at", { ascending: false });
      },
      {
        fallbackValue: [],
        errorMessage: "Failed to load bid history"
      }
    );
  }
}

// Export a singleton instance
export const carService = new CarService();
