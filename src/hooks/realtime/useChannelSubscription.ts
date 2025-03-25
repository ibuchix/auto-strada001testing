
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted subscription logic from RealtimeProvider.tsx
 */

import { useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { setupChannel } from './connectionUtils';

/**
 * Hook to manage channel subscriptions
 */
export const useChannelSubscription = () => {
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({});

  // Subscribe to a channel with improved error handling
  const subscribe = (channelName: string, tableName: string, callback: (payload: any) => void): RealtimeChannel => {
    // If channel already exists, return it
    if (channels[channelName]) {
      return channels[channelName];
    }

    // Create and setup the channel
    const channel = setupChannel(channelName, tableName, callback);

    // Add to channels state
    setChannels((prev) => ({ ...prev, [channelName]: channel }));
    
    return channel;
  };

  // Unsubscribe from a channel with improved cleanup
  const unsubscribe = (channelName: string) => {
    if (channels[channelName]) {
      try {
        console.log(`Unsubscribing from channel: ${channelName}`);
        channels[channelName].unsubscribe();
        setChannels((prev) => {
          const newChannels = { ...prev };
          delete newChannels[channelName];
          return newChannels;
        });
      } catch (error) {
        console.error(`Error unsubscribing from channel ${channelName}:`, error);
      }
    }
  };

  return { channels, subscribe, unsubscribe };
};
