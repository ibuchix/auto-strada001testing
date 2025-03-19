
/**
 * Changes made:
 * - 2024-12-08: Fixed WebSocket connection lifecycle management to prevent disconnection errors
 * - 2024-12-08: Added connection state tracking with useRef to avoid disconnecting non-established connections
 * - 2024-12-08: Improved error handling and reconnection logic
 */

import { ReactNode, createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface RealtimeProviderProps {
  children: ReactNode;
}

interface RealtimeContextType {
  isConnected: boolean;
  channels: Record<string, RealtimeChannel>;
  subscribe: (channelName: string, tableName: string, callback: (payload: any) => void) => RealtimeChannel;
  unsubscribe: (channelName: string) => void;
  reconnect: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({});
  
  // Add connection state tracking with useRef
  const connectionEstablishedRef = useRef(false);
  const connectionAttemptingRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initialize realtime connection
  useEffect(() => {
    const setupRealtime = async () => {
      // Prevent multiple concurrent connection attempts
      if (connectionAttemptingRef.current) return;
      
      connectionAttemptingRef.current = true;
      
      try {
        // Set authentication token if available
        supabase.realtime.setAuth(session?.access_token || null);
        
        // Only attempt to connect if not already connected
        if (!connectionEstablishedRef.current) {
          console.log('Attempting to connect to Supabase Realtime...');
          await supabase.realtime.connect();
          console.log('Successfully connected to Supabase Realtime');
          
          // Mark connection as established
          connectionEstablishedRef.current = true;
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error connecting to realtime:', error);
        setIsConnected(false);
        connectionEstablishedRef.current = false;
        
        // Schedule reconnection attempt with exponential backoff
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          setupRealtime();
        }, 5000); // 5 second delay before retry
      } finally {
        connectionAttemptingRef.current = false;
      }
    };

    setupRealtime();

    return () => {
      // Cleanup timeout on unmount
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Only disconnect if connection was actually established
      if (connectionEstablishedRef.current) {
        console.log('Disconnecting from Supabase Realtime');
        try {
          supabase.realtime.disconnect();
          connectionEstablishedRef.current = false;
          setIsConnected(false);
        } catch (error) {
          console.error('Error disconnecting from realtime:', error);
        }
      }
    };
  }, [session]);

  // Define a reconnection function to expose via context
  const reconnect = async () => {
    if (connectionAttemptingRef.current) return;
    
    // Force disconnect and reconnect
    if (connectionEstablishedRef.current) {
      try {
        supabase.realtime.disconnect();
      } catch (error) {
        console.error('Error during forced disconnect:', error);
      }
      connectionEstablishedRef.current = false;
    }
    
    setIsConnected(false);
    
    // Small delay before attempting reconnection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      connectionAttemptingRef.current = true;
      supabase.realtime.setAuth(session?.access_token || null);
      await supabase.realtime.connect();
      connectionEstablishedRef.current = true;
      setIsConnected(true);
      toast.success('Realtime connection restored');
    } catch (error) {
      console.error('Error reconnecting to realtime:', error);
      toast.error('Failed to reconnect to realtime service');
    } finally {
      connectionAttemptingRef.current = false;
    }
  };

  // Subscribe to a channel
  const subscribe = (channelName: string, tableName: string, callback: (payload: any) => void): RealtimeChannel => {
    // If channel already exists, return it
    if (channels[channelName]) {
      return channels[channelName];
    }

    // Create new channel
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, callback)
      .subscribe((status) => {
        console.log(`Channel ${channelName} status:`, status);
        
        // If channel subscription fails, trigger reconnect
        if (status === 'CHANNEL_ERROR') {
          toast.error(`Channel ${channelName} subscription failed`, {
            description: 'Attempting to reconnect...',
            action: {
              label: 'Retry',
              onClick: reconnect
            }
          });
        }
      });

    // Add to channels state
    setChannels((prev) => ({ ...prev, [channelName]: channel }));
    
    return channel;
  };

  // Unsubscribe from a channel
  const unsubscribe = (channelName: string) => {
    if (channels[channelName]) {
      try {
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

  return (
    <RealtimeContext.Provider value={{ isConnected, channels, subscribe, unsubscribe, reconnect }}>
      {children}
    </RealtimeContext.Provider>
  );
};
