
/**
 * Changes made:
 * - 2024-12-08: Fixed WebSocket connection lifecycle management to prevent disconnection errors
 * - 2024-12-08: Added connection state tracking with useRef to avoid disconnecting non-established connections
 * - 2024-12-08: Improved error handling and reconnection logic
 * - 2024-12-13: Enhanced WebSocket connection stability with better lifecycle management
 * - 2024-12-13: Fixed premature disconnection causing "WebSocket closed before connection established" errors
 * - 2024-12-13: Added connection debouncing to prevent rapid connect/disconnect cycles
 * - 2024-08-03: Fixed WebSocket lifecycle issues by adding proper connection state tracking and safer cleanup
 * - 2024-12-14: Fixed race condition in WebSocket connection leading to premature disconnections
 * - 2024-12-15: Added additional safeguards to prevent disconnection of unestablished connections
 * - 2024-12-16: Fixed WebSocket cleanup on unmount to prevent "closed before established" errors
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

// Connection states
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting'
}

export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<Record<string, RealtimeChannel>>({});
  
  // Enhanced connection state tracking 
  const connectionStateRef = useRef<ConnectionState>(ConnectionState.DISCONNECTED);
  const connectionDebounceRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const unmountingRef = useRef(false);
  const pageNavigatingRef = useRef(false);

  // Listen for beforeunload to detect page navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      pageNavigatingRef.current = true;
      console.log('Page navigation detected, marking for clean disconnect');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  
  // Initialize realtime connection with improved lifecycle management
  useEffect(() => {
    // Reset unmounting flag on mount
    unmountingRef.current = false;
    
    const setupRealtime = async () => {
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
        if (session?.access_token) {
          supabase.realtime.setAuth(session.access_token);
        } else {
          supabase.realtime.setAuth(null);
        }
        
        console.log('Attempting to connect to Supabase Realtime...');
        
        // Set up a timeout to detect connection failures
        if (connectionTimeoutRef.current) {
          window.clearTimeout(connectionTimeoutRef.current);
        }
        
        connectionTimeoutRef.current = window.setTimeout(() => {
          // Only handle timeout if still in connecting state
          if (connectionStateRef.current === ConnectionState.CONNECTING) {
            console.log('Connection attempt timed out');
            connectionStateRef.current = ConnectionState.DISCONNECTED;
            connectionTimeoutRef.current = null;
            
            // Schedule reconnection if not unmounting
            if (!unmountingRef.current) {
              if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
              }
              
              reconnectTimeoutRef.current = window.setTimeout(() => {
                if (!unmountingRef.current) {
                  setupRealtime();
                }
              }, 5000);
            }
          }
        }, 10000); // 10 second timeout
        
        // Attempt to connect
        await supabase.realtime.connect();
        
        // Cancel timeout since connection succeeded
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        
        // Update connection state and UI state
        if (!unmountingRef.current) {
          console.log('Successfully connected to Supabase Realtime');
          connectionStateRef.current = ConnectionState.CONNECTED;
          setIsConnected(true);
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
        setIsConnected(false);
        
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
      }
    };

    // Debounce connection attempt
    if (connectionDebounceRef.current) {
      clearTimeout(connectionDebounceRef.current);
    }
    
    // Only attempt connection if we're in a disconnected state
    if (connectionStateRef.current === ConnectionState.DISCONNECTED) {
      connectionDebounceRef.current = window.setTimeout(() => {
        if (!unmountingRef.current) {
          setupRealtime();
        }
      }, 300);
    }

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
      
      if (connectionTimeoutRef.current) {
        window.clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      
      // Only attempt to disconnect if we're in CONNECTED state
      // This prevents the "WebSocket closed before connection established" error
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
          
          setIsConnected(false);
        } catch (error) {
          console.error('Error disconnecting from realtime:', error);
        }
      } else {
        console.log(`Not disconnecting connection in state: ${connectionStateRef.current}`);
      }
    };
  }, [session]);

  // Enhanced reconnect function
  const reconnect = async () => {
    // Only allow reconnection if we're not already connecting
    if (connectionStateRef.current === ConnectionState.CONNECTING) {
      console.log('Connection attempt already in progress');
      return;
    }
    
    console.log('Manual reconnection initiated');
    
    // Force disconnect only if we have an established connection
    if (connectionStateRef.current === ConnectionState.CONNECTED) {
      try {
        console.log('Disconnecting before reconnection');
        connectionStateRef.current = ConnectionState.DISCONNECTING;
        supabase.realtime.disconnect();
        connectionStateRef.current = ConnectionState.DISCONNECTED;
      } catch (error) {
        console.error('Error during forced disconnect:', error);
        // Continue with reconnection regardless of disconnect error
        connectionStateRef.current = ConnectionState.DISCONNECTED;
      }
    }
    
    // Update UI state
    setIsConnected(false);
    
    // Small delay before attempting reconnection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      connectionStateRef.current = ConnectionState.CONNECTING;
      console.log('Reconnecting to Supabase Realtime...');
      
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      } else {
        supabase.realtime.setAuth(null);
      }
      
      await supabase.realtime.connect();
      
      // Update state
      connectionStateRef.current = ConnectionState.CONNECTED;
      setIsConnected(true);
      
      console.log('Reconnection successful');
      toast.success('Realtime connection restored');
    } catch (error) {
      // Reset connection state on error
      connectionStateRef.current = ConnectionState.DISCONNECTED;
      console.error('Error reconnecting to realtime:', error);
      
      toast.error('Failed to reconnect to realtime service', {
        description: 'Some real-time features may be unavailable',
        action: {
          label: 'Try Again',
          onClick: reconnect
        }
      });
    }
  };

  // Enhanced subscribe function with better error handling
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
