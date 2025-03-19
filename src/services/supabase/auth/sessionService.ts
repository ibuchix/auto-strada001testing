
/**
 * Changes made:
 * - 2024-11-18: Created dedicated service for session-related operations
 * - 2024-11-18: Extracted from userService.ts to improve maintainability
 */

import { Session, Provider } from "@supabase/supabase-js";
import { BaseService } from "../baseService";
import { toast } from "sonner";

export class SessionService extends BaseService {
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
}

// Export a singleton instance
export const sessionService = new SessionService();
