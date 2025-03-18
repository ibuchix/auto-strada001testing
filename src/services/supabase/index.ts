
/**
 * Changes made:
 * - 2024-09-11: Created service index to export all Supabase services
 */

// Export all services
export * from './baseService';
export * from './carService';
export * from './userService';
export * from './auctionService';
export * from './valuationService';

// Export a general API object with all services
import { carService } from './carService';
import { userService } from './userService';
import { auctionService } from './auctionService';
import { valuationService } from './valuationService';

export const supabaseApi = {
  cars: carService,
  users: userService,
  auctions: auctionService,
  valuations: valuationService,
};

export default supabaseApi;
