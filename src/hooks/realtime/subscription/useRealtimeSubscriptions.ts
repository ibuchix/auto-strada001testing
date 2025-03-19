
/**
 * Changes made:
 * - 2024-12-11: Refactored comprehensive real-time subscription system into domain-specific modules
 * - 2024-12-11: Created combined subscription hook that uses all domain-specific hooks
 */

import { Session } from '@supabase/supabase-js';
import { useListingSubscriptions } from './useListingSubscriptions';
import { useAuctionSubscriptions } from './useAuctionSubscriptions';
import { useBidSubscriptions } from './useBidSubscriptions';
import { useSellerSubscriptions } from './useSellerSubscriptions';

/**
 * Hook to manage all real-time subscriptions for a seller across different domains
 */
export const useRealtimeSubscriptions = (session: Session | null) => {
  const userId = session?.user?.id;
  const isActive = !!userId;
  
  // Use all domain-specific subscription hooks
  useListingSubscriptions(userId, isActive);
  useAuctionSubscriptions(userId, isActive);
  useBidSubscriptions(userId, isActive);
  useSellerSubscriptions(userId, isActive);
};
