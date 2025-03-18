
/**
 * Changes made:
 * - 2024-10-15: Created a dedicated hook for offline status management across the application
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook to track and manage online/offline status throughout the application
 */
export const useOfflineStatus = (options: {
  showToasts?: boolean;
  onOffline?: () => void;
  onOnline?: () => void;
} = {}) => {
  const { showToasts = true, onOffline, onOnline } = options;
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  const handleOnline = useCallback(() => {
    setIsOffline(false);
    if (showToasts) {
      toast.success("You're back online", {
        description: "Your changes will now be synchronized",
        duration: 3000
      });
    }
    if (onOnline) onOnline();
  }, [showToasts, onOnline]);
  
  const handleOffline = useCallback(() => {
    setIsOffline(true);
    if (showToasts) {
      toast.warning("You are offline", { 
        description: "Your changes will be saved locally and synced when you're back online",
        duration: 5000
      });
    }
    if (onOffline) onOffline();
  }, [showToasts, onOffline]);
  
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOffline,
    isOnline: !isOffline
  };
};
