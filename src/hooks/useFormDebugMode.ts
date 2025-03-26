
/**
 * Changes made:
 * - 2028-06-01: Created hook for enabling form debugging and testing features
 */

import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

/**
 * Debug mode features and settings for form development and testing
 */
export const useFormDebugMode = () => {
  const [isDebugModeEnabled, setIsDebugModeEnabled] = useLocalStorage('formDebugMode', false);
  const [showDebugPanel, setShowDebugPanel] = useLocalStorage('showDebugPanel', false);
  const [isKeypressListenerActive, setIsKeypressListenerActive] = useState(false);
  
  // Track key combinations for enabling debug mode
  useEffect(() => {
    if (isKeypressListenerActive) return;
    
    const keys: Record<string, boolean> = {};
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      
      // CTRL+SHIFT+D to toggle debug mode
      if (keys['Control'] && keys['Shift'] && keys['d']) {
        setIsDebugModeEnabled(!isDebugModeEnabled);
        setShowDebugPanel(!isDebugModeEnabled);
        
        console.log(`%c[DEBUG MODE ${!isDebugModeEnabled ? 'ENABLED' : 'DISABLED'}]`, 
          'background: #333; color: #bada55; padding: 2px 4px; border-radius: 2px;',
          'Press CTRL+SHIFT+D to toggle debug mode'
        );
        
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
  }, [isDebugModeEnabled, setIsDebugModeEnabled, setShowDebugPanel, isKeypressListenerActive]);
  
  // Log debug mode status to console
  useEffect(() => {
    if (isDebugModeEnabled) {
      console.log(
        '%c[FORM DEBUG MODE ENABLED]',
        'background: #333; color: #bada55; padding: 2px 4px; border-radius: 2px;',
        'Debug panels and diagnostic logging are now active.'
      );
    }
  }, [isDebugModeEnabled]);
  
  return {
    isDebugModeEnabled,
    setIsDebugModeEnabled,
    showDebugPanel,
    setShowDebugPanel
  };
};

/**
 * Initialize debug mode globally
 */
export const initializeDebugMode = () => {
  if (localStorage.getItem('formDebugMode') === 'true') {
    console.log(
      '%c[FORM DEBUG MODE ACTIVE]',
      'background: #333; color: #bada55; padding: 2px 4px; border-radius: 2px;',
      'Press CTRL+SHIFT+D to toggle debug mode'
    );
  }
};
