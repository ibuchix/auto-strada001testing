
/**
 * Changes made:
 * - 2024-11-18: Created dedicated service for seller-specific operations
 * - 2024-11-18: Extracted from userService.ts to improve maintainability
 */

import { BaseService } from "../baseService";
import { UserProfile } from "../profiles/profileService";

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
      // Try using the RPC function first (security definer function that bypasses RLS)
      const { data, error } = await this.supabase.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (error) {
        console.warn("RPC register_seller failed, falling back to manual update:", error);
        
        // Fallback method 1: Try to update profile directly
        try {
          await this.supabase
            .from('profiles')
            .upsert({ 
              id: userId, 
              role: 'seller',
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
            
          // Also create seller record if needed
          const { data: sellerExists } = await this.supabase
            .from('sellers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (!sellerExists) {
            await this.supabase
              .from('sellers')
              .insert({
                user_id: userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
          }
          
          // Update user metadata
          await this.supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          return true;
        } catch (fallbackError) {
          console.error("All seller registration methods failed:", fallbackError);
          throw fallbackError;
        }
      }
      
      return !!data;
    } catch (error: any) {
      this.handleError(error, "Failed to register as seller");
    }
  }
}

// Export a singleton instance
export const sellerProfileService = new SellerProfileService();
