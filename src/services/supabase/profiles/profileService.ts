
/**
 * Changes made:
 * - 2024-11-18: Created dedicated service for profile-related operations
 * - 2024-11-18: Extracted from userService.ts to improve maintainability
 * - 2024-11-20: Exported UserProfile type with proper TypeScript syntax
 */

import { BaseService } from "../baseService";

export interface UserProfile {
  id: string;
  full_name?: string;
  role?: "dealer" | "seller" | "admin";
  updated_at?: string;
  suspended?: boolean;
  avatar_url?: string;
}

export class ProfileService extends BaseService {
  /**
   * Get user profile with security definer function for RLS compatibility
   */
  async getUserProfile(userId: string, select: string = '*'): Promise<UserProfile> {
    try {
      // Always use the security definer function first for reliable access
      const { data: profileData, error: funcError } = await this.supabase
        .rpc('get_profile', { p_user_id: userId });
        
      if (!funcError && profileData && profileData.length > 0) {
        return profileData[0];
      }
      
      // Log the error and try direct query as fallback
      if (funcError) {
        console.warn("get_profile RPC failed, falling back to direct query:", funcError);
      }
      
      // Fall back to direct query if function fails
      return await this.handleDatabaseResponse(async () => {
        return await this.supabase
          .from('profiles')
          .select(select)
          .eq('id', userId)
          .single();
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
  
  /**
   * Update user profile with optimized return data
   */
  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    // Ensure we're passing the correct type for role
    const safeProfile: Partial<UserProfile> = {
      ...profile
    };
    
    try {
      const result = await this.handleDatabaseResponse(async () => {
        return await this.supabase
          .from('profiles')
          .update(safeProfile)
          .eq('id', userId)
          .select('id, role, updated_at')
          .single();
      });
      
      // If update succeeds, also update auth metadata for consistent role information
      if (safeProfile.role) {
        await this.supabase.auth.updateUser({
          data: { role: safeProfile.role }
        });
      }
      
      return result;
    } catch (error) {
      // If we get a permission error, the user might not have access to update their profile
      console.error("Error updating profile:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const profileService = new ProfileService();
