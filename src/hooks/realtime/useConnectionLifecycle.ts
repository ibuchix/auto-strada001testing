
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted connection lifecycle management from RealtimeProvider.tsx
 */

import { useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { ConnectionState } from './types';
import { connectToRealtime, safeDisconnect } from './connectionUtils';

/**
 * Hook to manage the WebSocket connection lifecycle
 */
export const useConnectionLifecycle = (session: Session | null) => {
  const [isConnected, setIsConnected] = useState(false);
  
  // Connection state tracking with refs
  const connectionStateRef = useRef<ConnectionState>(ConnectionState.DISCONNECTED);
  const connectionDebounceRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const unmountingRef = useRef(false);

  // Initialize realtime connection with improved lifecycle management
  useEffect(() => {
    // Reset unmounting flag on mount
    unmountingRef.current = false;
    
    const setupRealtime = async () => {
      const accessToken = session?.access_token;
      
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
      
      await connectToRealtime(
        connectionStateRef,
        unmountingRef,
        accessToken,
        () => {
          // Connection successful
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          setIsConnected(true);
        },
        (error) => {
          // Connection failed
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
      );
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
      
      safeDisconnect(connectionStateRef, { current: false }, unmountingRef);
      setIsConnected(false);
    };
  }, [session]);

  return {
    isConnected,
    setIsConnected,
    connectionStateRef,
    unmountingRef
  };
};
