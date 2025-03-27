
/**
 * Changes made:
 * - 2024-06-07: Created ProgressPreservation component to handle form persistence
 * - 2024-08-08: Updated to save current step along with form data
 * - 2024-09-02: Enhanced to expose lastSaved and offline status
 * - 2025-08-01: Updated props interface to include lastSaved
 */

import { useEffect } from "react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

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

  // This component doesn't render anything visible
  return null;
};
