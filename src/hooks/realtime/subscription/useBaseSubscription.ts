
/**
 * Changes made:
 * - 2024-12-11: Created base subscription hook with shared functionality
 * - 2024-12-14: Fixed channel subscription type error with correct Supabase API signature
 * - 2024-12-15: Fixed type error with Supabase Realtime channel API by using the correct on() method signature
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesFilter, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
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
    // Create the filter configuration for postgres_changes
    const filterConfig: RealtimePostgresChangesFilter<any> = {
      event: event,
      schema: 'public',
      table: table,
      filter: filter
    };

    return supabase
      .channel(channelName)
      .on('postgres_changes', filterConfig, handler)
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
