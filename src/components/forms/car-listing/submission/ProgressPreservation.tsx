
/**
 * Changes made:
 * - 2024-06-07: Created ProgressPreservation component to handle form persistence
 * - 2024-08-08: Updated to save current step along with form data
 * - 2024-09-02: Enhanced to expose lastSaved and offline status
 */

import { useFormContext } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useAuth } from "@/components/AuthProvider";
import { useFormPersistence } from "../hooks/useFormPersistence";
import { useState, useEffect } from "react";

interface ProgressPreservationProps {
  currentStep?: number;
  onLastSavedChange?: (date: Date | null) => void;
  onOfflineStatusChange?: (isOffline: boolean) => void;
}

export const ProgressPreservation = ({ 
  currentStep = 0,
  onLastSavedChange,
  onOfflineStatusChange 
}: ProgressPreservationProps) => {
  const form = useFormContext<CarListingFormData>();
  const { session } = useAuth();
  
  const { lastSaved, isOffline, carId } = useFormPersistence(
    form, 
    session?.user.id, 
    currentStep
  );
  
  // Propagate lastSaved date up to parent components
  useEffect(() => {
    if (onLastSavedChange) {
      onLastSavedChange(lastSaved);
    }
  }, [lastSaved, onLastSavedChange]);
  
  // Propagate offline status up to parent components
  useEffect(() => {
    if (onOfflineStatusChange) {
      onOfflineStatusChange(isOffline);
    }
  }, [isOffline, onOfflineStatusChange]);

  return null;
};
