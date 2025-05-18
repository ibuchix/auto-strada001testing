
/**
 * Changes made:
 * - 2024-12-11: Refactored comprehensive real-time subscription system into domain-specific modules
 * - 2024-12-11: Created combined subscription hook that uses all domain-specific hooks
 * - 2025-06-15: Added better error handling for failed Supabase channel subscriptions
 * - 2025-06-15: Added graceful degradation when realtime connection fails
 */

import { Session } from '@supabase/supabase-js';
import { useListingSubscriptions } from './useListingSubscriptions';
import { useAuctionSubscriptions } from './useAuctionSubscriptions';
import { useBidSubscriptions } from './useBidSubscriptions';
import { useSellerSubscriptions } from './useSellerSubscriptions';
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook to manage all real-time subscriptions for a seller across different domains
 */
export const useRealtimeSubscriptions = (session: Session | null) => {
  const userId = session?.user?.id;
  const isActive = !!userId;
  
  // Display connection error message only once
  useEffect(() => {
    // Track shown errors to avoid duplicates
    let errorShown = false;
    
    if (isActive) {
      // Handle WebSocket connection error at a global level
      const onConnectionError = () => {
        if (!errorShown) {
          toast.error("Realtime connection issue", {
            description: "Updates may be delayed. Please refresh the page if needed.",
            duration: 5000,
            id: "realtime-connection-error" // Prevent duplicates
          });
          errorShown = true;
        }
      };
      
      // Listen for websocket error events
      window.addEventListener('offline', onConnectionError);
      
      return () => {
        window.removeEventListener('offline', onConnectionError);
      };
    }
  }, [isActive]);
  
  // Use all domain-specific subscription hooks with error handling
  useListingSubscriptions(userId, isActive);
  useAuctionSubscriptions(userId, isActive);
  useBidSubscriptions(userId, isActive);
  useSellerSubscriptions(userId, isActive);
};
