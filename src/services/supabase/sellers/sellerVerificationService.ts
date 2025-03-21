
/**
 * Changes made:
 * - 2024-12-31: Extracted verification logic from sellerProfileService.ts
 * - Updated to reflect automatic verification of sellers
 */

import { BaseService } from "../baseService";

/**
 * Service for verifying seller registration
 */
export class SellerVerificationService extends BaseService {
  /**
   * Verify seller registration was successful by checking for profile and seller records
   * Updated to expect sellers to be automatically verified
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
      
      // Check if seller record exists and is verified
      const { data: seller, error: sellerError } = await this.supabase
        .from('sellers')
        .select('id, user_id, verification_status, is_verified')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (sellerError) {
        console.error("SellerVerificationService: Error verifying seller record:", sellerError);
      }
      
      if (!seller) {
        console.warn("SellerVerificationService: Seller record not found after registration");
      } else if (seller.verification_status !== 'verified' || !seller.is_verified) {
        console.warn("SellerVerificationService: Seller exists but not marked as verified:", 
          {status: seller.verification_status, verified: seller.is_verified});
          
        // Auto-fix: Update the seller to verified status if needed
        const { error: updateError } = await this.supabase
          .from('sellers')
          .update({
            verification_status: 'verified',
            is_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        if (updateError) {
          console.error("SellerVerificationService: Failed to update seller to verified status:", updateError);
        } else {
          console.log("SellerVerificationService: Successfully updated seller to verified status");
        }
      } else {
        console.log("SellerVerificationService: Seller record verified and properly marked as verified");
      }
      
      // Verify user metadata has seller role
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      
      if (userError) {
        console.error("SellerVerificationService: Error verifying user metadata:", userError);
      }
      
      if (!userData?.user?.user_metadata?.role || userData.user.user_metadata.role !== 'seller') {
        console.warn("SellerVerificationService: User metadata does not have seller role:", userData?.user?.user_metadata);
        
        // Auto-fix: Update user metadata if needed
        const { error: metadataError } = await this.supabase.auth.updateUser({
          data: { 
            role: 'seller',
            is_verified: true
          }
        });
        
        if (metadataError) {
          console.error("SellerVerificationService: Failed to update user metadata:", metadataError);
        } else {
          console.log("SellerVerificationService: Successfully updated user metadata with seller role");
        }
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
