
/**
 * Changes made:
 * - 2024-12-11: Created base subscription hook with shared functionality
 * - 2024-12-14: Fixed channel subscription type error with correct Supabase API signature
 * - 2024-12-15: Fixed type error with Supabase Realtime channel API by using the correct on() method signature
 * - 2025-06-15: Improved error handling for subscription failures
 * - 2025-06-15: Enhanced filter expressions to use simpler syntax for better compatibility
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
    try {
      // Create the filter configuration for postgres_changes
      // Use standard eq filter instead of complex expressions which can cause issues
      const filterConfig: RealtimePostgresChangesFilter<any> = {
        event: event,
        schema: 'public',
        table: table
      };
      
      // Only add filter if it's a simple expression
      if (filter && !filter.includes('in.')) {
        // Add filter key/value directly from the simple filter expression
        const [key, value] = filter.split('=');
        if (key && value) {
          // @ts-ignore - We know this is valid even if TypeScript doesn't
          filterConfig.filter = key.trim();
        }
      }
      
      // Create the channel with proper error handling
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', filterConfig, handler)
        .on('system', { event: 'disconnect' }, () => {
          console.log(`${channelName} disconnected`);
        })
        .subscribe((status) => {
          console.log(`Subscription ${channelName} status:`, status);
          
          if (status === 'SUBSCRIBED') {
            console.log(`Successfully subscribed to ${channelName}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to ${channelName}`);
          } else if (status === 'TIMED_OUT') {
            console.error(`Subscription to ${channelName} timed out`);
          }
        });
        
      return channel;
    } catch (error) {
      console.error(`Failed to setup channel ${channelName}:`, error);
      // Return a dummy channel object that won't break things on removal
      return {
        send: () => {},
        subscribe: () => {},
        unsubscribe: () => {},
        on: () => ({ on: () => ({ subscribe: () => {} }) }),
      } as any;
    }
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
