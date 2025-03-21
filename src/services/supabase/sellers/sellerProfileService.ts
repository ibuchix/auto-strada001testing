
/**
 * Changes made:
 * - 2024-11-18: Created dedicated service for seller-specific operations
 * - 2024-11-18: Extracted from userService.ts to improve maintainability
 * - 2024-11-20: Updated UserProfile import to fix TypeScript error
 * - 2024-12-18: Enhanced registerSeller with better error handling and fallbacks
 * - 2024-12-22: Added comprehensive error handling and multi-stage verification
 */

import { BaseService } from "../baseService";
import type { UserProfile } from "../profiles/profileService";

export interface SellerProfile extends UserProfile {
  company_name?: string;
  tax_id?: string;
  verification_status?: string;
  address?: string;
  is_verified?: boolean;
  user_id: string;
}

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
    try {
      console.log("SellerProfileService: Starting registration for user ID:", userId);
      
      // Stage 1: Update user metadata first
      try {
        const { error: metadataError } = await this.supabase.auth.updateUser({
          data: { role: 'seller' }
        });
        
        if (metadataError) {
          console.error("SellerProfileService: Failed to update user metadata:", metadataError);
        } else {
          console.log("SellerProfileService: Successfully updated user metadata with seller role");
        }
      } catch (metadataError) {
        console.error("SellerProfileService: Failed to update user metadata:", metadataError);
      }
      
      // Stage 2: Try using the RPC function first (security definer function that bypasses RLS)
      const { data, error } = await this.supabase.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (!error && data) {
        console.log("SellerProfileService: Successfully registered via RPC function");
        
        // Verify the registration was successful by checking for profile and seller records
        await this.verifySellerRegistration(userId);
        
        return true;
      }
      
      if (error) {
        console.warn("SellerProfileService: RPC register_seller failed, falling back to manual methods:", error);
        
        // Fallback method: Try to update profile directly
        try {
          console.log("SellerProfileService: Attempting manual profile creation/update");
          
          // First check if profile exists
          const { data: profileExists } = await this.supabase
            .from('profiles')
            .select('id, role')
            .eq('id', userId)
            .maybeSingle();
            
          if (profileExists) {
            console.log("SellerProfileService: Profile exists, updating role:", profileExists);
            // Update existing profile
            const { error: profileUpdateError } = await this.supabase
              .from('profiles')
              .update({ 
                role: 'seller',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
              
            if (profileUpdateError) {
              console.error("SellerProfileService: Failed to update profile:", profileUpdateError);
            }
          } else {
            console.log("SellerProfileService: Profile doesn't exist, creating new profile");
            // Create new profile
            const { error: profileCreateError } = await this.supabase
              .from('profiles')
              .insert({ 
                id: userId, 
                role: 'seller',
                updated_at: new Date().toISOString()
              });
              
            if (profileCreateError) {
              console.error("SellerProfileService: Failed to create profile:", profileCreateError);
            }
          }
              
          // Check if seller record exists, create if needed
          const { data: sellerExists } = await this.supabase
            .from('sellers')
            .select('id, user_id')
            .eq('user_id', userId)
            .maybeSingle();
              
          if (!sellerExists) {
            console.log("SellerProfileService: Seller record doesn't exist, creating new seller record");
            const { error: sellerCreateError } = await this.supabase
              .from('sellers')
              .insert({
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                verification_status: 'pending'
              });
              
            if (sellerCreateError) {
              console.error("SellerProfileService: Failed to create seller record:", sellerCreateError);
              throw sellerCreateError;
            }
          } else {
            console.log("SellerProfileService: Seller record already exists:", sellerExists);
          }
          
          // Verify the manual registration was successful
          await this.verifySellerRegistration(userId);
          
          console.log("SellerProfileService: Manual registration successful");
          return true;
        } catch (fallbackError) {
          console.error("SellerProfileService: All seller registration methods failed:", fallbackError);
          throw fallbackError;
        }
      }
      
      return !!data;
    } catch (error: any) {
      this.handleError(error, "Failed to register as seller");
      return false;
    }
  }
  
  /**
   * Verify seller registration was successful by checking for profile and seller records
   */
  private async verifySellerRegistration(userId: string): Promise<void> {
    try {
      // Check if profile exists with seller role
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, role')
        .eq('id', userId)
        .maybeSingle();
        
      if (profileError) {
        console.error("SellerProfileService: Error verifying profile:", profileError);
      }
      
      if (!profile) {
        console.warn("SellerProfileService: Profile not found after registration");
      } else if (profile.role !== 'seller') {
        console.warn("SellerProfileService: Profile exists but role is not 'seller':", profile.role);
      } else {
        console.log("SellerProfileService: Profile verified with seller role");
      }
      
      // Check if seller record exists
      const { data: seller, error: sellerError } = await this.supabase
        .from('sellers')
        .select('id, user_id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (sellerError) {
        console.error("SellerProfileService: Error verifying seller record:", sellerError);
      }
      
      if (!seller) {
        console.warn("SellerProfileService: Seller record not found after registration");
      } else {
        console.log("SellerProfileService: Seller record verified");
      }
      
      // Verify user metadata has seller role
      const { data: userData, error: userError } = await this.supabase.auth.getUser();
      
      if (userError) {
        console.error("SellerProfileService: Error verifying user metadata:", userError);
      }
      
      if (!userData?.user?.user_metadata?.role || userData.user.user_metadata.role !== 'seller') {
        console.warn("SellerProfileService: User metadata does not have seller role:", userData?.user?.user_metadata);
      } else {
        console.log("SellerProfileService: User metadata verified with seller role");
      }
    } catch (error) {
      console.error("SellerProfileService: Error during registration verification:", error);
    }
  }
}

// Export a singleton instance
export const sellerProfileService = new SellerProfileService();
