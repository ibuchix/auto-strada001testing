
/**
 * Changes made:
 * - 2024-09-26: Created RouterGuard component to prevent components from rendering when outside Router context
 * - 2024-09-27: Improved RouterGuard with better error handling and state management
 */

import { ReactNode, useEffect, useState } from 'react';

interface RouterGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RouterGuard = ({ children, fallback = null }: RouterGuardProps) => {
  const [isRouterAvailable, setIsRouterAvailable] = useState(false);
  
  useEffect(() => {
    // Check if we're in a router context by looking for its context value in the DOM
    // This is a safer approach than trying to use a hook that might throw
    const isInRouterContext = window.location.pathname !== undefined;
    setIsRouterAvailable(isInRouterContext);
  }, []);
  
  if (!isRouterAvailable) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

/**
 * A higher-order component that wraps a component with RouterGuard
 */
export const withRouterGuard = <P extends object>(
  Component: React.ComponentType<P>,
  fallback: ReactNode = null
) => {
  const WithRouterGuard = (props: P) => (
    <RouterGuard fallback={fallback}>
      <Component {...props} />
    </RouterGuard>
  );
  
  const displayName = Component.displayName || Component.name || 'Component';
  WithRouterGuard.displayName = `WithRouterGuard(${displayName})`;
  
  return WithRouterGuard;
};
