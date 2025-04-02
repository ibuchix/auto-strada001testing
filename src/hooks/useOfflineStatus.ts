
/**
 * Hook to detect online/offline status
 * Created: 2026-05-10
 * Updated: 2026-05-12: Modified to accept options parameter with showToasts option
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface UseOfflineStatusOptions {
  showToasts?: boolean;
}

export function useOfflineStatus(options: UseOfflineStatusOptions = {}) {
  const { showToasts = false } = options;
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Update network status
    const handleStatusChange = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      
      // Show toast notification if enabled
      if (showToasts) {
        if (offline) {
          toast.warning("You're offline", {
            description: "Some features may be limited until you reconnect.",
            duration: 5000
          });
        } else {
          toast.success("You're back online", {
            description: "All features are now available.",
            duration: 3000
          });
        }
      }
    };

    // Listen to the online status
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, [showToasts]);

  return { isOffline };
}
