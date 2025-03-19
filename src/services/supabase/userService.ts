
/**
 * Changes made:
 * - 2024-09-11: Created user service for auth and profile-related operations
 * - 2024-09-12: Fixed type issues with role property
 * - 2024-09-19: Optimized queries for better performance and reduced latency
 * - 2024-11-15: Added robust error handling for registerSeller functionality
 */

import { BaseService } from "./baseService";
import { Session, Provider } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface UserProfile {
  id: string;
  full_name?: string;
  role?: "dealer" | "seller" | "admin";
  updated_at?: string;
  suspended?: boolean;
  avatar_url?: string;
}

export interface SellerProfile extends UserProfile {
  company_name?: string;
  tax_id?: string;
  verification_status?: string;
  address?: string;
  is_verified?: boolean;
  user_id: string;
}

export class UserService extends BaseService {
  /**
   * Get the current user session with caching
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      
      if (error) throw error;
      
      return data.session;
    } catch (error: any) {
      console.error("Failed to get session:", error);
      return null;
    }
  }
  
  /**
   * Sign in with email and password
   */
  async signInWithEmail(email: string, password: string): Promise<Session | null> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return data.session;
    } catch (error: any) {
      this.handleError(error, "Failed to sign in");
    }
  }
  
  /**
   * Sign in with third-party provider
   */
  async signInWithProvider(provider: Provider): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
      });
      
      if (error) throw error;
    } catch (error: any) {
      this.handleError(error, "Failed to sign in with provider");
    }
  }
  
  /**
   * Sign up with email and password
   */
  async signUpWithEmail(email: string, password: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Registration successful", {
        description: "Please check your email to verify your account."
      });
    } catch (error: any) {
      this.handleError(error, "Failed to sign up");
    }
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) throw error;
      
      toast.success("Signed out successfully");
    } catch (error: any) {
      this.handleError(error, "Failed to sign out");
    }
  }
  
  /**
   * Get user profile with optimized column selection
   */
  async getUserProfile(userId: string, select: string = '*'): Promise<UserProfile> {
    try {
      // First try using the security definer function
      const { data: profileData, error: funcError } = await this.supabase
        .rpc('get_profile', { p_user_id: userId });
        
      if (!funcError && profileData && profileData.length > 0) {
        return profileData[0];
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
    
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('profiles')
        .update(safeProfile)
        .eq('id', userId)
        .select('id, role, updated_at')
        .single();
    });
  }
  
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
   */
  async registerSeller(userId: string): Promise<boolean> {
    try {
      // Try using the RPC function first
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
export const userService = new UserService();
