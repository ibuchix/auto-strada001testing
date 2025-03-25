
/**
 * Changes made:
 * - 2024-12-18: Created this file as part of RealtimeProvider refactoring
 * - 2024-12-18: Extracted page navigation detection from RealtimeProvider.tsx
 */

import { useEffect, useRef } from 'react';

/**
 * Hook to detect page navigation to prevent disconnect errors
 */
export const usePageNavigation = () => {
  const pageNavigatingRef = useRef(false);

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

  return pageNavigatingRef;
};
