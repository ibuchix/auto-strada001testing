
/**
 * Changes made:
 * - 2024-12-18: Completely refactored file to reduce complexity and improve maintainability
 * - 2024-12-18: Split code into multiple smaller modules and hooks
 * - 2024-12-18: Improved WebSocket connection lifecycle management
 * - 2024-12-18: Maintained all functionality while reducing file size
 * - 2024-12-19: Fixed import for RealtimeProviderProps from types.tsx
 * - 2024-12-20: Enhanced page navigation detection with connection state reference
 * - 2024-12-20: Fixed navigation blocking issues with improved disconnection handling
 */

import { useAuth } from './AuthProvider';
import { RealtimeContext } from '@/hooks/realtime/RealtimeContext';
import { RealtimeProviderProps } from '@/hooks/realtime/types.tsx';
import { useConnectionLifecycle } from '@/hooks/realtime/useConnectionLifecycle';
import { useChannelSubscription } from '@/hooks/realtime/useChannelSubscription';
import { useReconnect } from '@/hooks/realtime/useReconnect';
import { usePageNavigation } from '@/hooks/realtime/usePageNavigation';

export { useRealtime } from '@/hooks/realtime/RealtimeContext';

export const RealtimeProvider = ({ children }: RealtimeProviderProps) => {
  const { session } = useAuth();
  
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
