
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted page navigation detection from RealtimeProvider.tsx
 * - 2024-12-20: Enhanced to support non-blocking WebSocket disconnection during navigation
 * - 2024-12-20: Added reference to connection state for improved disconnection handling
 * - 2027-07-15: Added more robust connection handling during navigation
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
      console.log('Page navigation detected, marking for clean disconnect');
      
      // Mark as navigating to prevent any blocking operations
      pageNavigatingRef.current = true;
      
      // Store navigation event for debugging
      try {
        localStorage.setItem('navigationEvent', new Date().toISOString());
        localStorage.setItem('navigationSource', 'beforeunload');
      } catch (e) {
        console.error('Error storing navigation event:', e);
      }
      
      // Use our non-blocking disconnect if connection state is available
      if (connectionStateRef) {
        console.log('Using non-blocking disconnect during navigation');
        navigationSafeDisconnect(connectionStateRef);
      }
    };
    
    // Listen for navigation events
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Enhanced navigation detection using history events
    const handleHistoryEvent = () => {
      console.log('History navigation detected');
      pageNavigatingRef.current = true;
      
      try {
        localStorage.setItem('navigationEvent', new Date().toISOString());
        localStorage.setItem('navigationSource', 'history');
      } catch (e) {
        console.error('Error storing navigation event:', e);
      }
      
      if (connectionStateRef) {
        navigationSafeDisconnect(connectionStateRef);
      }
    };
    
    // Monitor both popstate and pushstate events for navigation
    window.addEventListener('popstate', handleHistoryEvent);
    
    // Monitor hash changes as well
    window.addEventListener('hashchange', handleHistoryEvent);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handleHistoryEvent);
      window.removeEventListener('hashchange', handleHistoryEvent);
    };
  }, [connectionStateRef]);

  return pageNavigatingRef;
};
