
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted connection utilities from RealtimeProvider.tsx
 * - 2024-12-19: Fixed import for ConnectionState from types.tsx
 * - 2024-12-20: Enhanced disconnection handling to prevent navigation blocking
 * - 2024-12-20: Added non-blocking disconnection for page navigation
 */

import { MutableRefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConnectionState } from './types.tsx';
import { toast } from 'sonner';

/**
 * Safely disconnect from Supabase Realtime
 */
export const safeDisconnect = (
  connectionStateRef: MutableRefObject<ConnectionState>,
  pageNavigatingRef: MutableRefObject<boolean>,
  unmountingRef: MutableRefObject<boolean>
) => {
  // Only attempt to disconnect if we're in CONNECTED state
  if (connectionStateRef.current === ConnectionState.CONNECTED && !pageNavigatingRef.current) {
    console.log('Disconnecting from established Supabase Realtime connection (cleanup)');
    
    try {
      // Update state before disconnecting
      connectionStateRef.current = ConnectionState.DISCONNECTING;
      
      // Use setTimeout to avoid race conditions during unmount
      setTimeout(() => {
        try {
          supabase.realtime.disconnect();
        } catch (e) {
          console.error('Error during delayed disconnect:', e);
        }
      }, 0);
    } catch (error) {
      console.error('Error disconnecting from realtime:', error);
    }
  } else {
    console.log(`Not disconnecting connection in state: ${connectionStateRef.current}`);
  }
};

/**
 * Non-blocking disconnect for navigation events
 * This version doesn't wait for the disconnect to complete
 */
export const navigationSafeDisconnect = (
  connectionStateRef: MutableRefObject<ConnectionState>
) => {
  console.log('Navigation-safe disconnection initiated');
  
  // Mark as disconnecting but don't block navigation
  if (connectionStateRef.current === ConnectionState.CONNECTED) {
    connectionStateRef.current = ConnectionState.DISCONNECTING;
    
    // Fire and forget disconnection - don't block navigation
    setTimeout(() => {
      try {
        supabase.realtime.disconnect();
        console.log('Completed navigation-safe disconnection');
      } catch (e) {
        console.error('Error during navigation-safe disconnect (non-blocking):', e);
      }
    }, 0);
  } else {
    console.log(`Navigation-safe disconnect skipped, connection in state: ${connectionStateRef.current}`);
  }
};

/**
 * Initialize and establish a realtime connection
 */
export const connectToRealtime = async (
  connectionStateRef: MutableRefObject<ConnectionState>,
  unmountingRef: MutableRefObject<boolean>,
  accessToken: string | undefined,
  onSuccess: () => void,
  onError: (error: any) => void
) => {
  // Prevent connection attempts if already connecting
  if (connectionStateRef.current === ConnectionState.CONNECTING) {
    console.log('Connection attempt already in progress, skipping');
    return;
  }
  
  // Don't attempt to connect if we're unmounting or already connected
  if (unmountingRef.current || connectionStateRef.current === ConnectionState.CONNECTED) {
    console.log('Component is unmounting or already connected, skipping connection attempt');
    return;
  }
  
  // Update connection state
  connectionStateRef.current = ConnectionState.CONNECTING;
  
  try {
    // Set authentication token if available
    if (accessToken) {
      supabase.realtime.setAuth(accessToken);
    } else {
      supabase.realtime.setAuth(null);
    }
    
    console.log('Attempting to connect to Supabase Realtime...');
    
    // Attempt to connect
    await supabase.realtime.connect();
    
    // Update connection state and UI state if not unmounting
    if (!unmountingRef.current) {
      console.log('Successfully connected to Supabase Realtime');
      connectionStateRef.current = ConnectionState.CONNECTED;
      onSuccess();
    } else {
      // If we connected but component unmounted during the process,
      // we need to clean up the connection
      console.log('Connected but component unmounted, cleaning up');
      try {
        supabase.realtime.disconnect();
      } catch (e) {
        console.error('Error during cleanup of successful connection after unmount:', e);
      }
    }
  } catch (error) {
    console.error('Error connecting to realtime:', error);
    
    // Reset connection state
    connectionStateRef.current = ConnectionState.DISCONNECTED;
    onError(error);
  }
};

/**
 * Setup channel functions
 */
export const setupChannel = (
  channelName: string, 
  tableName: string, 
  callback: (payload: any) => void
) => {
  console.log(`Subscribing to channel: ${channelName} for table: ${tableName}`);
  
  // Create new channel with improved error handling
  return supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in channel ${channelName} callback:`, error);
      }
    })
    .subscribe((status) => {
      console.log(`Channel ${channelName} status:`, status);
      
      // If channel subscription fails, show error with reconnect option
      if (status === 'CHANNEL_ERROR') {
        toast.error(`Channel ${channelName} subscription failed`, {
          description: 'Attempting to reconnect...'
        });
      }
    });
};
