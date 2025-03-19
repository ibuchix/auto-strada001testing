
/**
 * Changes made:
 * - 2024-07-06: Created hook for seller-specific session management
 * - 2024-07-06: Updated to not force redirect on public pages
 * - 2024-07-06: Fixed issues with supabase client initialization
 * - 2024-08-25: Refactored for improved performance and better error handling
 * - 2024-08-25: Added more reliable seller role detection with caching optimization
 * - 2024-11-14: Enhanced seller role checking to handle RLS permission issues
 * - 2024-11-14: Added fallback mechanisms for seller verification when database queries fail
 * - 2024-11-15: Improved error handling for profile access with multiple fallback methods
 */

import { useEffect, useState, useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseErrorHandling } from "@/hooks/useSupabaseErrorHandling";
import { ErrorCategory } from "@/utils/errorHandlers";

export const useSellerSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const navigate = useNavigate();
  const { handleSupabaseError } = useSupabaseErrorHandling({
    showToast: false,
    defaultCategory: ErrorCategory.AUTHENTICATION
  });

  /**
   * Efficiently checks if a user has seller role using multiple methods with fallbacks
   */
  const checkSellerRole = useCallback(async (currentSession: Session) => {
    try {
      // Method 1: Check user metadata first (fastest path)
      if (currentSession.user.user_metadata?.role === 'seller') {
        setIsSeller(true);
        return true;
      }

      // Method 2: Check profiles table using the security definer function
      try {
        const { data: profile, error } = await supabase
          .rpc('get_profile', { p_user_id: currentSession.user.id });

        if (!error && profile && profile.length > 0 && profile[0]?.role === 'seller') {
          // Update user metadata to match profile role for future reference
          await supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          setIsSeller(true);
          return true;
        }
      } catch (profileError) {
        // Don't throw here - continue to the next check method
        console.warn("Profile check via function failed, trying direct query:", profileError);
      }

      // Method 3: Direct profile query with explicit selection
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentSession.user.id)
          .single();

        if (!error && profile?.role === 'seller') {
          // Update user metadata to match profile role for future reference
          await supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          setIsSeller(true);
          return true;
        }
      } catch (directQueryError) {
        // Don't throw here - continue to the next check method
        console.warn("Direct profile query failed, trying fallback methods:", directQueryError);
      }

      // Method 4: Check sellers table directly
      try {
        const { data: seller, error: sellerError } = await supabase
          .from('sellers')
          .select('id')
          .eq('user_id', currentSession.user.id)
          .maybeSingle();
          
        if (!sellerError && seller) {
          // Found in sellers table - update user metadata
          await supabase.auth.updateUser({
            data: { role: 'seller' }
          });
          
          // Also ensure profile table is synced
          await supabase
            .from('profiles')
            .upsert({ 
              id: currentSession.user.id, 
              role: 'seller',
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            });
          
          setIsSeller(true);
          return true;
        }
      } catch (sellerError) {
        console.warn("Seller table check failed:", sellerError);
      }

      // Method 5: Use register_seller RPC if all else fails
      try {
        const { data: registerResult, error: registerError } = await supabase
          .rpc('register_seller', { p_user_id: currentSession.user.id });

        if (!registerError && registerResult) {
          console.log("Successfully registered as seller via RPC");
          setIsSeller(true);
          return true;
        }
      } catch (registerError) {
        console.warn("Register seller RPC failed:", registerError);
      }
      
      // No seller status found after trying all methods
      setIsSeller(false);
      return false;
    } catch (error) {
      console.error('Error checking seller role:', error);
      setIsSeller(false);
      return false;
    }
  }, [handleSupabaseError]);

  useEffect(() => {
    let mounted = true;
    
    // Initialize session state
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (mounted) {
          if (data.session) {
            setSession(data.session);
            await checkSellerRole(data.session);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up subscription to auth state changes
    const subscription = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      if (mounted) {
        setSession(newSession);
        
        if (newSession) {
          await checkSellerRole(newSession);
        } else {
          setIsSeller(false);
        }
        
        setIsLoading(false);
      }
    });

    initializeSession();

    // Cleanup function
    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, [navigate, checkSellerRole]);

  /**
   * Force refresh seller status - useful after registration or role changes
   * Has enhanced fallback mechanisms for handling permissions issues
   */
  const refreshSellerStatus = useCallback(async () => {
    if (!session) return false;
    
    setIsLoading(true);
    const result = await checkSellerRole(session);
    setIsLoading(false);
    return result;
  }, [session, checkSellerRole]);

  return {
    session,
    isLoading,
    isSeller,
    refreshSellerStatus
  };
};
