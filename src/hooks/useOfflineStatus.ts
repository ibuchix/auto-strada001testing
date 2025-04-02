
/**
 * Hook to detect and monitor offline status
 * Created 2028-05-15: Provides offline status monitoring for the application
 */

import { useState, useEffect } from "react";

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      console.log("Network connection lost");
    };
    
    const handleOnline = () => {
      setIsOffline(false);
      console.log("Network connection restored");
    };
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Initial check
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);
  
  return { isOffline };
}
