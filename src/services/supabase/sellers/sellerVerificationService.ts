
/**
 * Changes made:
 * - 2024-12-31: Extracted verification logic from sellerProfileService.ts
 * - Updated to reflect automatic verification of sellers
 * - 2025-05-07: Enhanced error handling for RLS-related permission issues
 * - 2025-05-07: Added fallback mechanisms when profile or seller data cannot be accessed
 */

import { BaseService } from "../baseService";
import { profileService } from "../profiles/profileService";

/**
 * Service for verifying seller registration
 */
export class SellerVerificationService extends BaseService {
  /**
   * Verify seller registration was successful by checking for profile and seller records
   * Updated to expect sellers to be automatically verified
   * Enhanced with better error handling for RLS permission issues
   */
  async verifySellerRegistration(userId: string): Promise<void> {
    try {
      // Check if profile exists with seller role using security definer function
      try {
        const profile = await profileService.getUserProfile(userId);
        
        if (!profile) {
          console.warn("SellerVerificationService: Profile not found after registration");
        } else if (profile.role !== 'seller') {
          console.warn("SellerVerificationService: Profile exists but role is not 'seller':", profile.role);
        } else {
          console.log("SellerVerificationService: Profile verified with seller role");
        }
      } catch (profileError) {
        console.error("SellerVerificationService: Error verifying profile:", profileError);
        // Continue with verification process despite error
      }
      
      // Check if seller record exists and is verified
      try {
        const { data: seller, error: sellerError } = await this.supabase
          .from('sellers')
          .select('id, user_id, verification_status, is_verified')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (sellerError) {
          console.error("SellerVerificationService: Error verifying seller record:", sellerError);
          // If permission denied, try to get status via RPC if available
          if (sellerError.code === '42501') {
            try {
              const { data: sellerExists } = await this.supabase.rpc('check_seller_exists', {
                p_user_id: userId
              });
              
              if (sellerExists?.exists) {
                console.log("SellerVerificationService: Verified seller exists via RPC");
              }
            } catch (rpcError) {
              console.warn("SellerVerificationService: RPC check failed:", rpcError);
            }
          }
        } else if (!seller) {
          console.warn("SellerVerificationService: Seller record not found after registration");
        } else if (seller.verification_status !== 'verified' || !seller.is_verified) {
          console.warn("SellerVerificationService: Seller exists but not marked as verified:", 
            {status: seller.verification_status, verified: seller.is_verified});
            
          // Auto-fix: Update the seller to verified status if needed
          try {
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
          } catch (updateError) {
            console.error("SellerVerificationService: Error updating seller status:", updateError);
          }
        } else {
          console.log("SellerVerificationService: Seller record verified and properly marked as verified");
        }
      } catch (sellerError) {
        console.error("SellerVerificationService: Error checking seller record:", sellerError);
      }
      
      // Verify user metadata has seller role
      try {
        const { data: userData, error: userError } = await this.supabase.auth.getUser();
        
        if (userError) {
          console.error("SellerVerificationService: Error verifying user metadata:", userError);
        } else if (!userData?.user?.user_metadata?.role || userData.user.user_metadata.role !== 'seller') {
          console.warn("SellerVerificationService: User metadata does not have seller role:", userData?.user?.user_metadata);
          
          // Auto-fix: Update user metadata if needed
          try {
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
          } catch (metadataError) {
            console.error("SellerVerificationService: Error updating metadata:", metadataError);
          }
        } else {
          console.log("SellerVerificationService: User metadata verified with seller role");
        }
      } catch (metadataError) {
        console.error("SellerVerificationService: Error checking user metadata:", metadataError);
      }
    } catch (error) {
      console.error("SellerVerificationService: Error during registration verification:", error);
      // Don't throw errors from this verification process, as it's meant to be a background check
      // that shouldn't block the UI or user's workflow
    }
  }
}

// Export a singleton instance
export const sellerVerificationService = new SellerVerificationService();
