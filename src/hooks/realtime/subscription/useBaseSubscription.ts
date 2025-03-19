
/**
 * Changes made:
 * - 2024-12-11: Created base subscription hook with shared functionality
 * - 2024-12-14: Fixed channel subscription type error with correct Supabase API signature
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Base hook for realtime subscriptions
 */
export const useBaseSubscription = (userId: string | undefined, isActive: boolean) => {
  const queryClient = useQueryClient();
  
  const setupChannel = (
    channelName: string,
    table: string,
    filter: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    handler: (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => void
  ): RealtimeChannel => {
    return supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        },
        handler
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${channelName}`);
          toast.error(`Failed to connect to ${channelName} updates`);
        }
      });
  };
  
  // Utility function to invalidate queries by key
  const invalidateQueries = (queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  };
  
  return {
    setupChannel,
    invalidateQueries,
    queryClient,
    userId,
    isActive
  };
};
