
/**
 * Changes made:
 * - 2024-09-11: Created service index to export all Supabase services
 * - 2024-09-12: Added proper import for sellerService
 * - 2024-09-17: Fixed import and export naming for services
 * - 2024-09-18: Updated imports to use the exported singleton instances
 */

// Export all services
export * from './baseService';
export * from './carService';
export * from './userService';
export * from './auctionService';
export * from './valuationService';
export * from './sellerService';

// Export a general API object with all services
import { carService } from './carService';
import { userService } from './userService';
import { auctionService } from './auctionService';
import { valuationService } from './valuationService';
import { sellerService } from './sellerService';

export const supabaseApi = {
  cars: carService,
  users: userService,
  auctions: auctionService,
  valuations: valuationService,
  sellers: sellerService
};

export default supabaseApi;
