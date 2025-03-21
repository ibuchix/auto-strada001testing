
/**
 * Changes made:
 * - 2024-12-08: Fixed WebSocket connection lifecycle management to prevent disconnection errors
 * - 2024-12-08: Added connection state tracking with useRef to avoid disconnecting non-established connections
 * - 2024-12-08: Improved error handling and reconnection logic
 * - 2024-12-13: Enhanced WebSocket connection stability with better lifecycle management
 * - 2024-12-13: Fixed premature disconnection causing "WebSocket closed before connection established" errors
 * - 2024-12-13: Added connection debouncing to prevent rapid connect/disconnect cycles
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
  
  // Enhanced connection state tracking with useRef
  const connectionEstablishedRef = useRef(false);
  const connectionAttemptingRef = useRef(false);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectionDebounceRef = useRef<number | null>(null);
  const unmountingRef = useRef(false);

  // Initialize realtime connection with better lifecycle management
  useEffect(() => {
    // Clear flag on mount
    unmountingRef.current = false;
    
    const setupRealtime = async () => {
      // Prevent multiple concurrent connection attempts
      if (connectionAttemptingRef.current) {
        console.log('Connection attempt already in progress, skipping');
        return;
      }
      
      // Don't attempt to connect if we're unmounting
      if (unmountingRef.current) {
        console.log('Component is unmounting, skipping connection attempt');
        return;
      }
      
      connectionAttemptingRef.current = true;
      
      try {
        // Set authentication token if available
        supabase.realtime.setAuth(session?.access_token || null);
        
        // Only attempt to connect if not already connected
        if (!connectionEstablishedRef.current) {
          console.log('Attempting to connect to Supabase Realtime...');
          
          // Use a timeout to track connection success/failure
          const connectionTimeout = setTimeout(() => {
            console.log('Connection attempt timed out');
            connectionAttemptingRef.current = false;
            
            // Schedule reconnection
            if (reconnectTimeoutRef.current) {
              window.clearTimeout(reconnectTimeoutRef.current);
            }
            
            if (!unmountingRef.current) {
              reconnectTimeoutRef.current = window.setTimeout(() => {
                if (!unmountingRef.current) {
                  setupRealtime();
                }
              }, 5000);
            }
          }, 10000); // 10 second timeout
          
          await supabase.realtime.connect();
          
          // Cancel timeout since connection succeeded
          clearTimeout(connectionTimeout);
          
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
        
        if (!unmountingRef.current) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (!unmountingRef.current) {
              setupRealtime();
            }
          }, 5000); // 5 second delay before retry
        }
      } finally {
        connectionAttemptingRef.current = false;
      }
    };

    // Debounce connection attempt to prevent rapid connect/disconnect cycles
    if (connectionDebounceRef.current) {
      clearTimeout(connectionDebounceRef.current);
    }
    
    connectionDebounceRef.current = window.setTimeout(() => {
      if (!unmountingRef.current) {
        setupRealtime();
      }
    }, 300);

    // Cleanup function with improved lifecycle management
    return () => {
      // Signal that we're unmounting
      unmountingRef.current = true;
      
      // Clear all timeouts
      if (connectionDebounceRef.current) {
        clearTimeout(connectionDebounceRef.current);
        connectionDebounceRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Only attempt to disconnect if we actually have an established connection
      // This prevents the "WebSocket closed before connection established" error
      if (connectionEstablishedRef.current) {
        console.log('Disconnecting from Supabase Realtime (cleanup)');
        try {
          // Use a small delay to ensure any pending operations complete
          setTimeout(() => {
            try {
              supabase.realtime.disconnect();
            } catch (e) {
              console.error('Error during delayed disconnect:', e);
            }
          }, 100);
          
          connectionEstablishedRef.current = false;
          setIsConnected(false);
        } catch (error) {
          console.error('Error disconnecting from realtime:', error);
        }
      } else {
        console.log('No established connection to disconnect');
      }
    };
  }, [session]);

  // Define a reconnection function with improved error handling
  const reconnect = async () => {
    if (connectionAttemptingRef.current) {
      console.log('Connection attempt already in progress');
      return;
    }
    
    console.log('Manual reconnection initiated');
    
    // Force disconnect only if we have an established connection
    if (connectionEstablishedRef.current) {
      try {
        console.log('Disconnecting before reconnection');
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
      console.log('Reconnecting to Supabase Realtime...');
      supabase.realtime.setAuth(session?.access_token || null);
      await supabase.realtime.connect();
      connectionEstablishedRef.current = true;
      setIsConnected(true);
      console.log('Reconnection successful');
      toast.success('Realtime connection restored');
    } catch (error) {
      console.error('Error reconnecting to realtime:', error);
      toast.error('Failed to reconnect to realtime service', {
        description: 'Some real-time features may be unavailable',
        action: {
          label: 'Try Again',
          onClick: reconnect
        }
      });
    } finally {
      connectionAttemptingRef.current = false;
    }
  };

  // Subscribe to a channel with better error handling
  const subscribe = (channelName: string, tableName: string, callback: (payload: any) => void): RealtimeChannel => {
    // If channel already exists, return it
    if (channels[channelName]) {
      return channels[channelName];
    }

    console.log(`Subscribing to channel: ${channelName} for table: ${tableName}`);
    
    // Create new channel with improved error handling
    const channel = supabase
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

  return (
    <RealtimeContext.Provider value={{ 
      isConnected, 
      channels, 
      subscribe, 
      unsubscribe, 
      reconnect 
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};
