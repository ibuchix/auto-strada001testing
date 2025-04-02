
/**
 * Debug hook to track component renders
 * Created 2028-05-15: Helps identify unnecessary renders and performance issues
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
    
    return () => {
      if (renderCount.current === 1) {
        console.log(`[${componentName}] Unmounted after ${renderCount.current} render`);
      }
    };
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
