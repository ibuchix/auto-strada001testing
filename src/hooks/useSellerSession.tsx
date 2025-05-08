
/**
 * Changes made:
 * - 2025-05-08: Created hook for managing seller sessions
 * - 2025-05-08: Added refreshSellerStatus function
 * - 2025-05-08: Enhanced seller detection with multiple fallbacks
 * - 2025-05-08: Updated to use useSupabaseClient from auth-helpers-react
 */

import { useState, useEffect, useCallback } from "react";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSellerRoleCheck } from './seller/useSellerRoleCheck';

export function useSellerSession() {
  const [isSeller, setIsSeller] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseClient = useSupabaseClient();
  
  // Import the role checking functionality
  const { checkSellerRole } = useSellerRoleCheck();

  // Initialize state on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);

        // Get current session
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
          // Check if the user is a seller
          const sellerStatus = await checkSellerRole(session);
          setIsSeller(sellerStatus);
        } else {
          setIsSeller(false);
        }
      } catch (error) {
        console.error("Error checking seller session:", error);
        setIsSeller(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const sellerStatus = await checkSellerRole(session);
          setIsSeller(sellerStatus);
        } else {
          setIsSeller(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseClient, checkSellerRole]);

  // Function to refresh seller status
  const refreshSellerStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      
      if (!session) {
        setIsSeller(false);
        return false;
      }
      
      const sellerStatus = await checkSellerRole(session);
      setIsSeller(sellerStatus);
      return sellerStatus;
    } catch (error) {
      console.error("Error refreshing seller status:", error);
      return false;
    }
  }, [supabaseClient, checkSellerRole]);

  return { isSeller, isLoading, refreshSellerStatus };
}
