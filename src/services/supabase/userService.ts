
/**
 * Changes made:
 * - 2024-09-11: Created user service for auth and profile-related operations
 * - 2024-09-12: Fixed type issues with role property
 * - 2024-09-19: Optimized queries for better performance and reduced latency
 * - 2024-11-15: Added robust error handling for registerSeller functionality
 * - 2024-11-16: Updated methods to work with Row Level Security policies
 * - 2024-11-18: Refactored into smaller services for better maintainability
 * - 2024-11-18: Simplified to re-export from specialized service modules
 * - 2024-11-20: Fixed TypeScript errors with proper "export type" syntax
 * - 2024-12-31: Fixed import path for SellerProfile type
 */

// Re-export from specialized service modules
export { sessionService } from './auth/sessionService';
// Use "export type" for type exports when isolatedModules is enabled
export { profileService } from './profiles/profileService';
export type { UserProfile } from './profiles/profileService';
export { sellerProfileService } from './sellers/sellerProfileService';
export type { SellerProfile } from './sellers/types';

// For backward compatibility, create a consolidated service
import { BaseService } from "./baseService";
import { sessionService } from './auth/sessionService';
import { profileService } from './profiles/profileService';
import { sellerProfileService } from './sellers/sellerProfileService';

// Create a unified service that delegates to specialized services
class UserService extends BaseService {
  // Session operations
  getSession = sessionService.getSession.bind(sessionService);
  signInWithEmail = sessionService.signInWithEmail.bind(sessionService);
  signInWithProvider = sessionService.signInWithProvider.bind(sessionService);
  signUpWithEmail = sessionService.signUpWithEmail.bind(sessionService);
  signOut = sessionService.signOut.bind(sessionService);
  
  // Profile operations
  getUserProfile = profileService.getUserProfile.bind(profileService);
  updateUserProfile = profileService.updateUserProfile.bind(profileService);
  
  // Seller operations
  getSellerProfile = sellerProfileService.getSellerProfile.bind(sellerProfileService);
  registerSeller = sellerProfileService.registerSeller.bind(sellerProfileService);
}

// Export backward-compatible singleton instance
export const userService = new UserService();
