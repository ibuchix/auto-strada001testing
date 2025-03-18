
/**
 * Changes made:
 * - 2024-07-06: Created hook for seller-specific session management
 * - 2024-07-06: Updated to not force redirect on public pages
 * - 2024-07-06: Fixed issues with supabase client initialization
 * - 2024-08-25: Refactored for improved performance and better error handling
 * - 2024-08-25: Added more reliable seller role detection with caching optimization
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
   * Efficiently checks if a user has seller role using both metadata and database
   */
  const checkSellerRole = useCallback(async (currentSession: Session) => {
    try {
      // Check user metadata first (fastest path)
      if (currentSession.user.user_metadata?.role === 'seller') {
        setIsSeller(true);
        return true;
      }

      // If not in metadata, check profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentSession.user.id)
        .single();

      if (error) {
        handleSupabaseError(error, 'Failed to verify seller status');
        return false;
      }

      const hasSellerRole = profile?.role === 'seller';
      
      // Update user metadata if seller role found in profile but not in metadata
      if (hasSellerRole && currentSession.user.user_metadata?.role !== 'seller') {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: 'seller' }
        });
        
        if (updateError) {
          console.warn('Could not update user metadata with role:', updateError);
        }
      }
      
      setIsSeller(hasSellerRole);
      return hasSellerRole;
    } catch (error) {
      console.error('Error checking seller role:', error);
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
          toast.error("Failed to initialize session");
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
