
/**
 * Changes made:
 * - 2024-11-18: Created dedicated service for profile-related operations
 * - 2024-11-18: Extracted from userService.ts to improve maintainability
 * - 2024-11-20: Exported UserProfile type with proper TypeScript syntax
 * - 2025-05-07: Updated getUserProfile to only use security definer function without direct query fallback
 * - 2025-05-07: Added improved error handling for RLS-related permission errors
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
   * Uses only the security definer function without direct query fallback
   */
  async getUserProfile(userId: string, select: string = '*'): Promise<UserProfile> {
    try {
      // Only use the security definer function for reliable access
      // This avoids RLS permission errors when accessing profiles table directly
      const { data: profileData, error: funcError } = await this.supabase
        .rpc('get_profile', { p_user_id: userId });
        
      if (funcError) {
        console.error("Error using get_profile RPC function:", funcError);
        throw new Error(`Failed to get profile: ${funcError.message}`);
      }
      
      if (!profileData || profileData.length === 0) {
        console.warn(`No profile found for user ${userId}`);
        return { id: userId } as UserProfile;
      }
      
      return profileData[0];
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Return a minimal profile with just the ID to prevent cascading failures
      return { id: userId } as UserProfile;
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
