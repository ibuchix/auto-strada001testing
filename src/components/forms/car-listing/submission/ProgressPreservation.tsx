
/**
 * Changes made:
 * - 2024-06-07: Created ProgressPreservation component to handle form persistence
 * - 2024-08-08: Updated to save current step along with form data
 * - 2024-09-02: Enhanced to expose lastSaved and offline status
 * - 2025-08-01: Updated props interface to include lastSaved
 * - 2025-10-01: Added logging for periodic saving activity
 */

import { useEffect } from "react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { CACHE_KEYS, getFromCache } from "@/services/offlineCacheService";

interface ProgressPreservationProps {
  currentStep: number;
  lastSaved: Date | null;
  onOfflineStatusChange?: (isOffline: boolean) => void;
}

export const ProgressPreservation = ({ 
  currentStep,
  lastSaved, 
  onOfflineStatusChange 
}: ProgressPreservationProps) => {
  const { isOffline } = useOfflineStatus();
  
  // Propagate offline status up to parent components
  useEffect(() => {
    if (onOfflineStatusChange) {
      onOfflineStatusChange(isOffline);
    }
  }, [isOffline, onOfflineStatusChange]);

  // Log persistence status on mount and when lastSaved changes
  useEffect(() => {
    const lastStep = getFromCache<string>(CACHE_KEYS.FORM_STEP, null);
    const lastMileage = getFromCache<string>(CACHE_KEYS.TEMP_MILEAGE, null);
    
    console.log('Form persistence status:', {
      isOffline,
      lastSaved: lastSaved ? lastSaved.toISOString() : null,
      cachedStep: lastStep,
      cachedMileage: lastMileage,
      currentStep
    });
  }, [isOffline, lastSaved, currentStep]);

  // This component doesn't render anything visible
  return null;
};
