
/**
 * Changes made:
 * - 2024-12-31: Extracted verification logic from sellerProfileService.ts
 */

import { BaseService } from "../baseService";

/**
 * Service for verifying seller registration
 */
export class SellerVerificationService extends BaseService {
  /**
   * Verify seller registration was successful by checking for profile and seller records
   */
  async verifySellerRegistration(userId: string): Promise<void> {
    try {
      // Check if profile exists with seller role
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error("SellerVerificationService: Error verifying profile:", profileError);
      }
      
      if (!profile) {
        console.warn("SellerVerificationService: Profile not found after registration");
      } else if (profile.role !== 'seller') {
        console.warn("SellerVerificationService: Profile exists but role is not 'seller':", profile.role);
      } else {
        console.log("SellerVerificationService: Profile verified with seller role");
      }
      
      // Check if seller record exists
      const { data: seller, error: sellerError } = await this.supabase
        .from('sellers')
        .select('id, user_id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (sellerError) {
        console.error("SellerVerificationService: Error verifying seller record:", sellerError);
      }
      
      if (!seller) {
        console.warn("SellerVerificationService: Seller record not found after registration");
      } else {
        console.log("SellerVerificationService: Seller record verified");
      }
      
      // Verify user metadata has seller role
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      
      if (userError) {
        console.error("SellerVerificationService: Error verifying user metadata:", userError);
      }
      
      if (!userData?.user?.user_metadata?.role || userData.user.user_metadata.role !== 'seller') {
        console.warn("SellerVerificationService: User metadata does not have seller role:", userData?.user?.user_metadata);
      } else {
        console.log("SellerVerificationService: User metadata verified with seller role");
      }
    } catch (error) {
      console.error("SellerVerificationService: Error during registration verification:", error);
    }
  }
}

// Export a singleton instance
export const sellerVerificationService = new SellerVerificationService();
