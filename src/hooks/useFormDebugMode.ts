
/**
 * Changes made:
 * - 2025-04-06: Simplified debug mode hook to prevent unnecessary logging in production
 */

import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Debug mode features and settings for form development and testing
 * Disabled by default in production
 */
export const useFormDebugMode = () => {
  // In production, debug is always false regardless of localStorage
  const isProduction = process.env.NODE_ENV === 'production';
  
  const [isDebugModeEnabled, setIsDebugModeEnabled] = useLocalStorage('formDebugMode', false);
  const [showDebugPanel, setShowDebugPanel] = useLocalStorage('showDebugPanel', false);
  const [isKeypressListenerActive, setIsKeypressListenerActive] = useState(false);
  
  // Never enable debug in production
  const actualDebugEnabled = isProduction ? false : isDebugModeEnabled;
  const actualDebugPanel = isProduction ? false : showDebugPanel;
  
  // Only set up keystroke listener in development
  useEffect(() => {
    if (isProduction || isKeypressListenerActive) return;
    
    const keys: Record<string, boolean> = {};
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      
      // CTRL+SHIFT+D to toggle debug mode
      if (keys['Control'] && keys['Shift'] && keys['d']) {
        setIsDebugModeEnabled(!isDebugModeEnabled);
        setShowDebugPanel(!isDebugModeEnabled);
        
        // Only log in development
        console.log(`[DEBUG MODE ${!isDebugModeEnabled ? 'ENABLED' : 'DISABLED'}]`);
        
        // Clear keys to prevent repeated triggers
        Object.keys(keys).forEach(key => {
          keys[key] = false;
        });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    setIsKeypressListenerActive(true);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      setIsKeypressListenerActive(false);
    };
  }, [isDebugModeEnabled, setIsDebugModeEnabled, setShowDebugPanel, isKeypressListenerActive, isProduction]);
  
  return {
    isDebugModeEnabled: actualDebugEnabled,
    setIsDebugModeEnabled: isProduction ? () => {} : setIsDebugModeEnabled,
    showDebugPanel: actualDebugPanel,
    setShowDebugPanel: isProduction ? () => {} : setShowDebugPanel
  };
};

/**
 * Initialize debug mode globally - does nothing in production
 */
export const initializeDebugMode = () => {
  if (process.env.NODE_ENV !== 'production' && localStorage.getItem('formDebugMode') === 'true') {
    console.log('[FORM DEBUG MODE ACTIVE] Press CTRL+SHIFT+D to toggle debug mode');
  }
};
