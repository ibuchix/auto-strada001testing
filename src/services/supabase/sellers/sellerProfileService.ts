
/**
 * Changes made:
 * - 2024-11-18: Created dedicated service for seller-specific operations
 * - 2024-11-18: Extracted from userService.ts to improve maintainability
 * - 2024-11-20: Updated UserProfile import to fix TypeScript error
 * - 2024-12-18: Enhanced registerSeller with better error handling and fallbacks
 * - 2024-12-22: Added comprehensive error handling and multi-stage verification
 * - 2024-12-31: Refactored into smaller files for better maintainability
 */

import { BaseService } from "../baseService";
import { SellerProfile } from "./types";
import { sellerRegistrationService } from "./sellerRegistrationService";

export class SellerProfileService extends BaseService {
  /**
   * Get seller profile with optimized column selection
   */
  async getSellerProfile(userId: string, select: string = '*'): Promise<SellerProfile> {
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('sellers')
        .select(select)
        .eq('user_id', userId)
        .single();
    });
  }
  
  /**
   * Register as a seller with enhanced error handling and retry logic
   * Designed to work with RLS policies
   */
  async registerSeller(userId: string): Promise<boolean> {
    // Delegate to specialized registration service
    return await sellerRegistrationService.registerSeller(userId);
  }
}

// Export a singleton instance
export const sellerProfileService = new SellerProfileService();

// Re-export types for backward compatibility
export type { SellerProfile } from "./types";
