
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted page navigation detection from RealtimeProvider.tsx
 * - 2024-12-20: Enhanced to support non-blocking WebSocket disconnection during navigation
 * - 2024-12-20: Added reference to connection state for improved disconnection handling
 */

import { useEffect, useRef, MutableRefObject } from 'react';
import { ConnectionState } from './types.tsx';
import { navigationSafeDisconnect } from './connectionUtils';

/**
 * Hook to detect page navigation to prevent disconnect errors
 */
export const usePageNavigation = (connectionStateRef?: MutableRefObject<ConnectionState>) => {
  const pageNavigatingRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = () => {
      pageNavigatingRef.current = true;
      console.log('Page navigation detected, marking for clean disconnect');
      
      // Use our non-blocking disconnect if connection state is available
      if (connectionStateRef) {
        navigationSafeDisconnect(connectionStateRef);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [connectionStateRef]);

  return pageNavigatingRef;
};
