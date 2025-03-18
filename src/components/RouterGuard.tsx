
/**
 * Changes made:
 * - 2024-09-26: Created RouterGuard component to prevent components from rendering when outside Router context
 */

import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface RouterGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RouterGuard = ({ children, fallback = null }: RouterGuardProps) => {
  const [isRouterAvailable, setIsRouterAvailable] = useState(false);
  
  // Try to use a router hook - if it doesn't throw an error, we're in a router context
  try {
    useLocation();
    // If we get here, router context is available
    if (!isRouterAvailable) {
      setIsRouterAvailable(true);
    }
  } catch (e) {
    // If we catch an error, we're outside router context
    if (isRouterAvailable) {
      setIsRouterAvailable(false);
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
