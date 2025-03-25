
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted reconnection logic from RealtimeProvider.tsx
 */

import { useState, MutableRefObject } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { connectToRealtime } from './connectionUtils';
import { ConnectionState } from './types';

/**
 * Hook to handle reconnection logic
 */
export const useReconnect = (
  connectionStateRef: MutableRefObject<ConnectionState>, 
  unmountingRef: MutableRefObject<boolean>,
  setIsConnected: (value: boolean) => void
) => {
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

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
    
    const session = await supabase.auth.getSession();
    const accessToken = session?.data?.session?.access_token;
    
    await connectToRealtime(
      connectionStateRef,
      unmountingRef,
      accessToken,
      () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        toast.success('Realtime connection restored');
      },
      (error) => {
        console.error('Reconnection error:', error);
        connectionStateRef.current = ConnectionState.DISCONNECTED;
        setReconnectAttempts(prev => prev + 1);
        
        toast.error('Failed to reconnect to realtime service', {
          description: 'Some real-time features may be unavailable',
          action: {
            label: 'Try Again',
            onClick: reconnect
          }
        });
      }
    );
  };

  return { reconnect };
};
