
/**
 * Changes made:
 * - 2024-09-11: Created service index to export all Supabase services
 * - 2024-09-12: Added proper import for sellerService
 * - 2024-09-17: Fixed import and export naming for services
 * - 2024-09-18: Updated imports to use the exported singleton instances
 * - 2024-09-19: Added performance optimizations and improved service exports
 * - 2024-10-28: Updated to import from transaction system's new location
 * - 2024-11-18: Updated to include refactored user-related services
 * - 2024-11-20: Fixed TypeScript errors with proper type exports
 * - 2024-12-31: Updated import paths for refactored seller services
 * - 2024-12-31: Fixed SellerProfile type import from types.ts
 * - 2024-10-15: Updated imports for refactored base and valuation services
 * - 2025-05-24: Fixed missing carService export
 * - 2025-05-30: Fixed circular dependency issues in exports
 */

// Export services from auth module
export * from './auth/sessionService';

// Export services from profiles module
export { profileService } from './profiles/profileService';
export type { UserProfile } from './profiles/profileService';

// Export services from sellers module
export { sellerProfileService } from './sellers/sellerProfileService';
export type { SellerProfile } from './sellers/types';

// Export all other services
export * from './baseService';
export * from './carService';
export * from './userService';
export * from './auctionService';
export * from './valuation/index';
export * from './sellerService';
export * from './transactions';

// Import singleton instances
import { carService } from './carService';
import { userService } from './userService';
import { auctionService } from './auctionService';
import { valuationService } from './valuationService';
import { sellerService } from './sellerService';
import { transactionService } from './transactions';
import { sessionService } from './auth/sessionService';
import { profileService } from './profiles/profileService';
import { sellerProfileService } from './sellers/sellerProfileService';

// Export a general API object with all services
export const supabaseApi = {
  cars: carService,
  users: userService,
  auctions: auctionService,
  valuations: valuationService,
  sellers: sellerService,
  transactions: transactionService,
  session: sessionService,
  profiles: profileService,
  sellerProfiles: sellerProfileService
};

export default supabaseApi;
