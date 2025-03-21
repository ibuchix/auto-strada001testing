
/**
 * Changes made:
 * - Updated to support automatic verification of sellers
 * - 2024-12-31: Fixed type import to use types.ts instead of local definition
 */

import { BaseService } from "../baseService";
import { SellerProfile } from "./types";
import { sellerRegistrationService } from "./sellerRegistrationService";
import { sellerVerificationService } from "./sellerVerificationService";

/**
 * Service for seller profile-related operations
 */
export class SellerProfileService extends BaseService {
  /**
   * Get seller profile with optimized column selection
   */
  async getSellerProfile(userId: string): Promise<SellerProfile | null> {
    try {
      // Try security definer function first (bypasses RLS)
      const { data: sdData, error: sdError } = await this.supabase
        .rpc('get_seller_profile', { p_user_id: userId });
        
      if (!sdError && sdData && sdData.length > 0) {
        console.log("Retrieved seller profile via security definer function");
        return sdData[0] as SellerProfile;
      }
      
      if (sdError) {
        console.warn("Security definer function failed, falling back to direct query:", sdError);
      }
      
      // Fall back to direct query
      const { data, error } = await this.supabase
        .from('sellers')
        .select(`
          id, user_id, full_name, company_name, 
          tax_id, verification_status, is_verified
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (error.code !== 'PGRST116') { // Not found is not a real error
          throw error;
        }
        return null;
      }
      
      return data as SellerProfile;
    } catch (error: any) {
      this.handleError(error, "Failed to fetch seller profile");
      return null;
    }
  }
  
  /**
   * Update seller profile with error handling
   */
  async updateSellerProfile(userId: string, profile: Partial<SellerProfile>): Promise<SellerProfile | null> {
    try {
      // Ensure verification status is maintained
      const safeProfile: Partial<SellerProfile> = {
        ...profile,
        verification_status: 'verified', // Always keep as verified
        is_verified: true                // Always keep as verified
      };
      
      const { data, error } = await this.supabase
        .from('sellers')
        .update(safeProfile)
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return data as SellerProfile;
    } catch (error: any) {
      this.handleError(error, "Failed to update seller profile");
      return null;
    }
  }
  
  /**
   * Register as a seller with automatic verification
   */
  async registerSeller(userId: string): Promise<boolean> {
    return await sellerRegistrationService.registerSeller(userId);
  }
  
  /**
   * Verify if a user is registered as a seller
   */
  async verifySellerRegistration(userId: string): Promise<boolean> {
    try {
      const sellerProfile = await this.getSellerProfile(userId);
      
      if (sellerProfile) {
        console.log("User is registered as seller with verification status:", sellerProfile.verification_status);
        // With the new approach, all sellers should be verified
        return true;
      }
      
      // Attempt repair if profile exists but seller record doesn't
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
        
      if (profile?.role === 'seller') {
        console.log("User has seller role in profile but no seller record. Attempting to repair...");
        return await this.registerSeller(userId);
      }
      
      return false;
    } catch (error) {
      console.error("Error verifying seller registration:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const sellerProfileService = new SellerProfileService();
