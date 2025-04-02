
/**
 * Changes made:
 * - 2024-10-15: Created OfflineIndicator component to show connection status
 * - 2026-05-12: Updated to match revised useOfflineStatus hook signature
 */

import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export const OfflineIndicator = () => {
  const { isOffline } = useOfflineStatus();
  const [show, setShow] = useState(false);
  
  // Show the indicator immediately if offline,
  // but delay hiding it to avoid flashing on reconnection
  useEffect(() => {
    if (isOffline) {
      setShow(true);
    } else {
      const timer = setTimeout(() => {
        setShow(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);
  
  if (!show) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-lg transition-colors ${
      isOffline 
        ? "bg-amber-100 text-amber-800" 
        : "bg-green-100 text-green-800"
    }`}>
      {isOffline ? (
        <>
          <WifiOff size={16} />
          <span>Offline Mode</span>
        </>
      ) : (
        <>
          <Wifi size={16} />
          <span>Connected</span>
        </>
      )}
    </div>
  );
};
