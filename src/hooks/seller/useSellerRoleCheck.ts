
/**
 * Changes made:
 * - 2024-11-18: Created dedicated hook for seller role verification
 * - 2024-11-18: Extracted from useSellerSession to improve maintainability
 * - 2024-11-18: Enhanced fallback mechanisms for seller role detection
 * - 2024-11-19: Updated to use refactored profile and seller services
 * - 2024-11-20: Fixed type imports with proper import syntax
 * - Updated to support automatic verification of sellers
 * - 2025-07-12: Prioritized metadata checks over database queries to improve reliability
 * - 2025-07-12: Added quick-path resolution when metadata contains seller role
 * - 2025-08-17: Enhanced debounce mechanism to prevent rendering cycles
 * - 2025-08-17: Improved logging for better diagnostic visibility
 */

import { useCallback } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { profileService, sellerProfileService } from "@/services/supabase";

/**
 * Hook providing functions to check if a user has seller role
 * Uses multiple fallback methods to ensure reliable role detection
 */
export const useSellerRoleCheck = () => {
  /**
   * Efficiently checks if a user has seller role using multiple methods with fallbacks
   * Prioritizes metadata check for maximum reliability and performance
   */
  const checkSellerRole = useCallback(async (currentSession: Session) => {
    try {
      // Prevent rapid consecutive calls
      const now = Date.now();
      const lastCheck = parseInt(localStorage.getItem('lastSellerRoleCheck') || '0');
      
      if (now - lastCheck < 2000) { // 2 second debounce
        console.log("Debouncing seller role check - too frequent");
        // Return the last check result from local storage to prevent flickering
        return localStorage.getItem('lastSellerStatus') === 'true';
      }
      
      localStorage.setItem('lastSellerRoleCheck', now.toString());
      
      // Method 1: Check user metadata first (fastest and most reliable path)
      console.log("Checking seller role from user metadata:", currentSession.user.user_metadata);
      if (currentSession.user.user_metadata?.role === 'seller') {
        console.log("User confirmed as seller via metadata");
        
        // Store result to prevent flickering on future checks
        localStorage.setItem('lastSellerStatus', 'true');
        
        // Even though we're returning true, try to fix potential data inconsistencies 
        // in the background without blocking the UI
        setTimeout(async () => {
          try {
            // Try to ensure profile and seller records exist
            await sellerProfileService.registerSeller(currentSession.user.id).catch(err => {
              console.log("Background seller registration attempt failed, but it's okay:", err);
            });
          } catch (error) {
            // Silently catch errors to prevent any issues in the UI
            console.warn("Background synchronization failed, but it's not critical:", error);
          }
        }, 500);
        
        return true;
      }

      // Method 2: Check profiles table using the security definer function
      try {
        const profile = await profileService.getUserProfile(currentSession.user.id);
        
        if (profile?.role === 'seller') {
          // Update user metadata to match profile role for future reference
          await supabase.auth.updateUser({
            data: { 
              role: 'seller',
              is_verified: true 
            }
          });
          
          localStorage.setItem('lastSellerStatus', 'true');
          return true;
        }
      } catch (profileError) {
        // Don't throw here - continue to the next check method
        console.warn("Profile check via function failed, trying direct query:", profileError);
      }

      // Method 3: Check sellers table directly
      try {
        const seller = await sellerProfileService.getSellerProfile(currentSession.user.id);
          
        if (seller) {
          // Found in sellers table - update user metadata
          await supabase.auth.updateUser({
            data: { 
              role: 'seller',
              is_verified: true
            }
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
          
          localStorage.setItem('lastSellerStatus', 'true');
          return true;
        }
      } catch (sellerError) {
        console.warn("Seller table check failed:", sellerError);
      }

      // No seller status found after trying all methods
      localStorage.setItem('lastSellerStatus', 'false');
      console.log("User is not a seller after checking all methods");
      return false;
    } catch (error) {
      console.error('Error checking seller role:', error);
      return false;
    }
  }, []);

  return { checkSellerRole };
};
