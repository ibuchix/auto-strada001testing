
/**
 * Debug hook to track component renders
 * Simplified for better performance in production
 */

import { useRef, useEffect } from "react";

interface DebugOptions {
  enabled?: boolean;
  trackProps?: boolean;
  trackDeps?: Record<string, any>;
}

export const useDebugRender = (
  componentName: string,
  options: DebugOptions = {}
) => {
  // Skip all debugging in production by default
  if (process.env.NODE_ENV === 'production' && options.enabled !== true) {
    return {
      renderCount: 0,
      debugLog: () => {}
    };
  }
  
  const { 
    enabled = process.env.NODE_ENV !== 'production',
    trackProps = false,
    trackDeps
  } = options;
  
  const renderCount = useRef(0);
  const prevDeps = useRef(trackDeps);
  
  useEffect(() => {
    if (!enabled) return;
    
    renderCount.current += 1;
    console.log(`[${componentName}] Render #${renderCount.current}`);
    
    // If tracking dependencies, check what changed
    if (trackDeps && prevDeps.current) {
      const changedDeps: Record<string, { prev: any; current: any }> = {};
      
      Object.keys(trackDeps).forEach(key => {
        if (prevDeps.current?.[key] !== trackDeps[key]) {
          changedDeps[key] = {
            prev: prevDeps.current?.[key],
            current: trackDeps[key]
          };
        }
      });
      
      if (Object.keys(changedDeps).length > 0) {
        console.log(`[${componentName}] Changed dependencies:`, changedDeps);
      }
      
      prevDeps.current = { ...trackDeps };
    }
  });
  
  return {
    renderCount: renderCount.current,
    debugLog: (message: string, ...args: any[]) => {
      if (enabled) {
        console.log(`[${componentName}] ${message}`, ...args);
      }
    }
  };
};
