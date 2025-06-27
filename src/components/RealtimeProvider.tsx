
/**
 * Changes made:
 * - 2024-12-18: Completely refactored file to reduce complexity and improve maintainability
 * - 2024-12-18: Split code into multiple smaller modules and hooks
 * - 2024-12-18: Improved WebSocket connection lifecycle management
 * - 2024-12-18: Maintained all functionality while reducing file size
 * - 2024-12-19: Fixed import for RealtimeProviderProps from types.tsx
 * - 2024-12-20: Enhanced page navigation detection with connection state reference
 * - 2024-12-20: Fixed navigation blocking issues with improved disconnection handling
 * - 2025-07-19: Improved token refresh handling to prevent invalid JWT errors
 * - 2025-06-14: Optimized connection lifecycle to reduce console noise and excessive reconnections  
 */

import { useAuth } from './AuthProvider';
import { RealtimeContext } from '@/hooks/realtime/RealtimeContext';
import { RealtimeProviderProps } from '@/hooks/realtime/types.tsx';
import { useConnectionLifecycle } from '@/hooks/realtime/useConnectionLifecycle';
import { useChannelSubscription } from '@/hooks/realtime/useChannelSubscription';
import { useReconnect } from '@/hooks/realtime/useReconnect';
import { usePageNavigation } from '@/hooks/realtime/usePageNavigation';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export { useRealtime } from '@/hooks/realtime/RealtimeContext';

export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const { session } = useAuth();
  const tokenRefreshTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Set up connection lifecycle management
  const {
    isConnected,
    setIsConnected,
    connectionStateRef,
    unmountingRef
  } = useConnectionLifecycle(session);
  
  // Pass connectionStateRef to page navigation to enable non-blocking disconnection
  const pageNavigatingRef = usePageNavigation(connectionStateRef);
  
  // Set up channel subscription management
  const { channels, subscribe, unsubscribe } = useChannelSubscription();
  
  // Set up reconnection functionality
  const { reconnect } = useReconnect(
    connectionStateRef, 
    unmountingRef,
    setIsConnected
  );
  
  // Handle JWT token refreshes with debouncing to prevent excessive reconnections
  useEffect(() => {
    if (!session) return;
    
    // Clear any existing timeout
    if (tokenRefreshTimeoutRef.current) {
      clearTimeout(tokenRefreshTimeoutRef.current);
    }
    
    // Debounce token refresh handling to prevent rapid reconnections
    tokenRefreshTimeoutRef.current = setTimeout(() => {
      // Only log in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Token refreshed, updating realtime connection');
      }
      
      // Remove all existing channels
      supabase.removeAllChannels();
      // Force a reconnect to use the new token
      reconnect();
    }, 500); // 500ms debounce
    
    return () => {
      if (tokenRefreshTimeoutRef.current) {
        clearTimeout(tokenRefreshTimeoutRef.current);
      }
    };
  }, [session?.access_token, reconnect]);

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
