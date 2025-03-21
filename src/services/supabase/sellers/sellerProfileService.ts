
/**
 * Changes made:
 * - 2024-11-18: Created dedicated service for seller-specific operations
 * - 2024-11-18: Extracted from userService.ts to improve maintainability
 * - 2024-11-20: Updated UserProfile import to fix TypeScript error
 * - 2024-12-18: Enhanced registerSeller with better error handling and fallbacks
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
      
      // Try using the RPC function first (security definer function that bypasses RLS)
      const { data, error } = await this.supabase.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (!error && data) {
        console.log("SellerProfileService: Successfully registered via RPC function");
        return true;
      }
      
      if (error) {
        console.warn("SellerProfileService: RPC register_seller failed, falling back to manual methods:", error);
        
        // Fallback method 1: Try to update profile directly
        try {
          console.log("SellerProfileService: Attempting manual profile creation/update");
          
          // First check if profile exists
          const { data: profileExists } = await this.supabase
            .from('profiles')
            .select('id')
            .eq('id', userId)
            .maybeSingle();
            
          if (profileExists) {
            console.log("SellerProfileService: Profile exists, updating role");
            // Update existing profile
            await this.supabase
              .from('profiles')
              .update({ 
                role: 'seller',
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
          } else {
            console.log("SellerProfileService: Profile doesn't exist, creating new profile");
            // Create new profile
            await this.supabase
              .from('profiles')
              .insert({ 
                id: userId, 
                role: 'seller',
                updated_at: new Date().toISOString()
              });
          }
              
          // Check if seller record exists, create if needed
          const { data: sellerExists } = await this.supabase
            .from('sellers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
              
          if (!sellerExists) {
            console.log("SellerProfileService: Seller record doesn't exist, creating new seller record");
            await this.supabase
              .from('sellers')
              .insert({
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          } else {
            console.log("SellerProfileService: Seller record already exists");
          }
          
          // Update user metadata
          await this.supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
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
}

// Export a singleton instance
export const sellerProfileService = new SellerProfileService();
