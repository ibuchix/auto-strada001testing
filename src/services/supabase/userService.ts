
/**
 * Changes made:
 * - 2024-09-11: Created user service for auth and profile-related operations
 * - 2024-09-12: Fixed type issues with role property
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
   * Get the current user session
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
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    });
  }
  
  /**
   * Update user profile
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
        .select()
        .single();
    });
  }
  
  /**
   * Get seller profile
   */
  async getSellerProfile(userId: string): Promise<SellerProfile> {
    return await this.handleDatabaseResponse(async () => {
      return await this.supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .single();
    });
  }
  
  /**
   * Register as a seller
   */
  async registerSeller(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('register_seller', {
        p_user_id: userId
      });
      
      if (error) throw error;
      
      return !!data;
    } catch (error: any) {
      this.handleError(error, "Failed to register as seller");
    }
  }
}

// Export a singleton instance
export const userService = new UserService();
