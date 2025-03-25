
/**
 * Changes made:
 * - 2024-09-13: Created comprehensive real-time subscription system for Supabase channels
 * - 2024-12-11: Refactored into domain-specific modules for better maintainability
 * - 2024-12-18: Updated import to reflect new RealtimeContext location
 */

import { Session } from '@supabase/supabase-js';
import { useRealtimeSubscriptions as useDomainSubscriptions } from './realtime/subscription/useRealtimeSubscriptions';

/**
 * Hook to manage all real-time subscriptions for a seller
 * This is a wrapper around the domain-specific subscription hooks
 */
export const useRealtimeSubscriptions = (session: Session | null) => {
  // Use the refactored subscriptions system
  useDomainSubscriptions(session);
};
