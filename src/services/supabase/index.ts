
/**
 * Changes made:
 * - 2024-09-11: Created service index to export all Supabase services
 * - 2024-09-12: Added proper import for sellerService
 * - 2024-09-17: Fixed import and export naming for services
 * - 2024-09-18: Updated imports to use the exported singleton instances
 * - 2024-09-19: Added performance optimizations and improved service exports
 * - 2024-10-28: Updated to import from transaction system's new location
 */

// Export all services
export * from './baseService';
export * from './carService';
export * from './userService';
export * from './auctionService';
export * from './valuationService';
export * from './sellerService';
export * from './transactions';

// Import singleton instances
import { carService } from './carService';
import { userService } from './userService';
import { auctionService } from './auctionService';
import { valuationService } from './valuationService';
import { sellerService } from './sellerService';
import { transactionService } from './transactions';

// Export a general API object with all services
export const supabaseApi = {
  cars: carService,
  users: userService,
  auctions: auctionService,
  valuations: valuationService,
  sellers: sellerService,
  transactions: transactionService
};

export default supabaseApi;
